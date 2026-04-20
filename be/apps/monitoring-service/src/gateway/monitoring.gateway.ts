import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

/**
 * WebSocket gateway — /ws/monitoring
 * Clients gửi { event: 'subscribe_farm', farmId } → được join vào room farmId
 * Server push { event: 'sensor_update', data: SensorReadingDto } (design.md §4.5)
 */
@WebSocketGateway({ namespace: '/ws/monitoring', cors: { origin: '*' } })
export class MonitoringGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MonitoringGateway.name);

  handleConnection(client: Socket): void {
    this.logger.log(`WS client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`WS client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribe_farm')
  handleSubscribeFarm(
    @MessageBody() data: { farmId: string },
    @ConnectedSocket() client: Socket,
  ): void {
    if (!data?.farmId) return;
    void client.join(`farm:${data.farmId}`);
    this.logger.log(`Client ${client.id} subscribed to farm ${data.farmId}`);
    client.emit('subscribed', { farmId: data.farmId });
  }

  /**
   * Broadcast sensor update đến tất cả subscribers của farm
   */
  pushSensorUpdate(farmId: string, reading: unknown): void {
    this.server.to(`farm:${farmId}`).emit('sensor_update', reading);
  }
}
