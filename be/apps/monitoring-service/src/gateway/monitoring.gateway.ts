import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { WsJwtGuard } from './guards/ws-jwt.guard';
import { corsOrigins, serviceUrlFromEnv, SERVICE_URL_KEYS } from '@trustagri/shared';
import type { JwtPayload } from '@trustagri/shared';

/**
 * WebSocket gateway — /ws/monitoring
 * Clients gửi { event: 'subscribe_farm', farmId } → được join vào room farmId
 * Server push { event: 'sensor_update', data: SensorReadingDto } (design.md §4.5)
 *
 * Auth: token phải được truyền trong handshake.auth.token (Bearer <jwt>).
 */
@Injectable()
@WebSocketGateway({
  // path (không phải namespace) để nginx prefix /ws/monitoring khớp đúng với socket.io handshake
  path: '/ws/monitoring/socket.io/',
  cors: { origin: corsOrigins, credentials: true },
})
export class MonitoringGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MonitoringGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  afterInit(server: Server): void {
    // Validate JWT at connection time so client.data.user is set before handleConnection fires.
    server.use(async (socket, next) => {
      const raw: string | undefined = socket.handshake.auth?.token ?? socket.handshake.headers?.authorization;
      const token = typeof raw === 'string' && raw.startsWith('Bearer ') ? raw.slice(7) : raw;
      if (!token) return next(new Error('UNAUTHORIZED'));
      try {
        const secret = this.config.getOrThrow<string>('JWT_SECRET');
        const payload = await this.jwtService.verifyAsync<JwtPayload>(token, { secret });
        socket.data.user = payload;
        next();
      } catch {
        next(new Error('UNAUTHORIZED'));
      }
    });
  }

  handleConnection(client: Socket): void {
    // user đã được set bởi middleware afterInit; nếu thiếu thì đã bị reject trước đó
    const user = client.data.user as JwtPayload;
    this.logger.log(`WS client connected: ${client.id} userId=${user.sub}`);
  }

  handleDisconnect(client: Socket): void {
    const userId = (client.data.user as JwtPayload | undefined)?.sub ?? 'unknown';
    this.logger.log(`WS client disconnected: ${client.id} userId=${userId}`);
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('subscribe_farm')
  async handleSubscribeFarm(
    @MessageBody() data: { farmId: string },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    if (!data?.farmId) return;

    const user = client.data.user as JwtPayload;
    const canRead = await this.canReadFarm(user, data.farmId, client);
    if (!canRead) {
      throw new WsException('FORBIDDEN');
    }

    void client.join(`farm:${data.farmId}`);
    this.logger.log(`userId=${user.sub} subscribed to farm ${data.farmId}`);
    client.emit('subscribed', { farmId: data.farmId });
  }

  /**
   * Broadcast sensor update đến tất cả subscribers của farm
   */
  pushSensorUpdate(farmId: string, reading: unknown): void {
    this.server.to(`farm:${farmId}`).emit('sensor_update', reading);
  }

  /** Kiểm tra quyền đọc farm — farm owner hoặc có hợp đồng active */
  private async canReadFarm(user: JwtPayload, farmId: string, client: Socket): Promise<boolean> {
    // Forward original auth header to internal services
    const authHeader = client.handshake.headers?.authorization as string | undefined;
    const headers = authHeader ? { Authorization: authHeader } : undefined;

    // Farm owner check via farm-service
    try {
      const farmServiceUrl = serviceUrlFromEnv(SERVICE_URL_KEYS.FARM);
      const res = await fetch(`${farmServiceUrl}/api/v1/farms/${farmId}`, {
        signal: AbortSignal.timeout(3000),
        headers,
      });
      if (res.ok) {
        const farm = (await res.json()) as { ownerId?: string };
        if (farm.ownerId === user.sub) return true;
      }
    } catch {
      // farm-service unreachable — fail-closed
      return false;
    }

    // Contract / order check via contract-service
    try {
      const contractServiceUrl = serviceUrlFromEnv(SERVICE_URL_KEYS.CONTRACT);
      const url = `${contractServiceUrl}/api/v1/contracts?farmId=${farmId}&status=active&limit=1`;
      const res = await fetch(url, { signal: AbortSignal.timeout(3000), headers });
      if (res.ok) {
        const body = (await res.json()) as { total?: number; items?: unknown[] };
        if ((body.total ?? body.items?.length ?? 0) > 0) return true;
      }
    } catch {
      return false;
    }

    return false;
  }
}
