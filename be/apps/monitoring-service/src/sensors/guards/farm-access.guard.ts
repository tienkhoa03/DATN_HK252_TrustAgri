import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { JwtPayload } from '@trustagri/shared';

/**
 * Kiểm soát truy cập dữ liệu cảm biến của một vườn.
 *
 * Cho phép truy cập nếu user là:
 *   1. Chủ nông trại (farm.ownerId === user.sub)
 *   2. Thương lái có hợp đồng active với vườn đó
 *   3. Người mua có order/hợp đồng active với vườn đó
 *
 * Chiến lược fail-open khi service phụ thuộc không phản hồi được.
 */
@Injectable()
export class FarmAccessGuard implements CanActivate {
  private readonly logger = new Logger(FarmAccessGuard.name);

  constructor(private readonly config: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context
      .switchToHttp()
      .getRequest<Request & { user?: JwtPayload }>();
    const user = req.user;
    const farmId = req.params['farmId'];

    if (!user || !farmId) {
      throw new ForbiddenException(
        'Không có thông tin xác thực hoặc thiếu farmId',
      );
    }

    if (await this.isFarmOwner(farmId, user.sub)) {
      return true;
    }

    if (user.role === 'trader') {
      const hasContract = await this.traderHasContract(farmId, user.sub);
      if (hasContract) return true;
      throw new ForbiddenException(
        'Thương lái không có hợp đồng active với vườn này',
      );
    }

    if (user.role === 'buyer') {
      const hasAccess = await this.buyerHasAccess(farmId, user.sub);
      if (hasAccess) return true;
      throw new ForbiddenException(
        'Người mua không có đơn hàng/hợp đồng với vườn này',
      );
    }

    throw new ForbiddenException(
      'Bạn không có quyền xem dữ liệu cảm biến của vườn này',
    );
  }

  /** Kiểm tra chủ vườn qua farm-service */
  private async isFarmOwner(farmId: string, userId: string): Promise<boolean> {
    const baseUrl = this.config.get<string>(
      'FARM_SERVICE_URL',
      'http://farm-service:3003',
    );
    try {
      const res = await fetch(`${baseUrl}/api/v1/farms/${farmId}`, {
        signal: AbortSignal.timeout(3000),
      });
      if (!res.ok) return false;
      const farm = (await res.json()) as { ownerId?: string };
      return farm.ownerId === userId;
    } catch (err) {
      this.logger.warn(
        `farm-service không phản hồi khi kiểm tra chủ vườn ${farmId}: ${(err as Error).message}`,
      );
      return false;
    }
  }

  /** Kiểm tra thương lái có hợp đồng active với vườn qua contract-service */
  private async traderHasContract(
    farmId: string,
    traderId: string,
  ): Promise<boolean> {
    const baseUrl = this.config.get<string>(
      'CONTRACT_SERVICE_URL',
      'http://contract-service:3004',
    );
    try {
      const url = `${baseUrl}/api/v1/contracts?farmId=${farmId}&traderId=${traderId}&status=active&limit=1`;
      const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
      if (!res.ok) {
        this.logger.warn(
          `contract-service trả về ${res.status} khi kiểm tra hợp đồng trader`,
        );
        return true; // fail-open
      }
      const body = (await res.json()) as {
        total?: number;
        items?: unknown[];
      };
      return (body.total ?? body.items?.length ?? 0) > 0;
    } catch (err) {
      this.logger.warn(
        `contract-service không phản hồi: ${(err as Error).message}. Fail-open.`,
      );
      return true; // fail-open
    }
  }

  /** Kiểm tra người mua có order hoặc hợp đồng active với vườn qua contract-service */
  private async buyerHasAccess(
    farmId: string,
    buyerId: string,
  ): Promise<boolean> {
    const baseUrl = this.config.get<string>(
      'CONTRACT_SERVICE_URL',
      'http://contract-service:3004',
    );
    try {
      // Kiểm tra hợp đồng
      const contractUrl = `${baseUrl}/api/v1/contracts?farmId=${farmId}&buyerId=${buyerId}&status=active&limit=1`;
      const contractRes = await fetch(contractUrl, {
        signal: AbortSignal.timeout(3000),
      });
      if (!contractRes.ok) return true; // fail-open
      const contractBody = (await contractRes.json()) as {
        total?: number;
        items?: unknown[];
      };
      if ((contractBody.total ?? contractBody.items?.length ?? 0) > 0) {
        return true;
      }

      // Kiểm tra order (accepted hoặc contracted)
      const orderUrl = `${baseUrl}/api/v1/orders?buyerId=${buyerId}&status=accepted&limit=1`;
      const orderRes = await fetch(orderUrl, {
        signal: AbortSignal.timeout(3000),
      });
      if (!orderRes.ok) return true; // fail-open
      const orderBody = (await orderRes.json()) as {
        total?: number;
        items?: unknown[];
      };
      return (orderBody.total ?? orderBody.items?.length ?? 0) > 0;
    } catch (err) {
      this.logger.warn(
        `contract-service không phản hồi: ${(err as Error).message}. Fail-open.`,
      );
      return true; // fail-open
    }
  }
}
