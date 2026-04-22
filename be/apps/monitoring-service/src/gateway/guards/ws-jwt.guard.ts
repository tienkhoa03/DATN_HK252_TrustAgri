import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import type { Socket } from 'socket.io';
import type { JwtPayload } from '@trustagri/shared';

@Injectable()
export class WsJwtGuard implements CanActivate {
  private readonly logger = new Logger(WsJwtGuard.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient<Socket>();
    const token = this.extractToken(client);

    if (!token) {
      throw new WsException('UNAUTHORIZED');
    }

    try {
      const secret = this.config.getOrThrow<string>('JWT_SECRET');
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, { secret });
      client.data.user = payload;
      return true;
    } catch {
      this.logger.warn(`WS auth failed for client ${client.id}`);
      throw new WsException('UNAUTHORIZED');
    }
  }

  private extractToken(client: Socket): string | undefined {
    const authToken: string | undefined = client.handshake.auth?.token;
    if (authToken?.startsWith('Bearer ')) return authToken.slice(7);
    const authHeader = client.handshake.headers?.authorization;
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      return authHeader.slice(7);
    }
    return undefined;
  }
}
