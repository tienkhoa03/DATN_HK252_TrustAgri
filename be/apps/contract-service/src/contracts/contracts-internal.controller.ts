import {
  Controller,
  ForbiddenException,
  Get,
  Headers,
  NotFoundException,
  Param,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ContractDto, Public } from '@trustagri/shared';
import { ContractsService } from './contracts.service';
import { ContractEntity } from './entities/contract.entity';

const HEADER = 'x-traceability-internal';

/**
 * Endpoint nội bộ phục vụ traceability công khai (farm-service gọi sang).
 * Bảo vệ bằng `X-Traceability-Internal` header (TRACEABILITY_INTERNAL_SECRET).
 * KHÔNG yêu cầu JWT.
 */
@ApiTags('contracts-internal')
@Controller('contracts/internal')
@Public()
export class ContractsInternalController {
  constructor(
    private readonly contractsService: ContractsService,
    private readonly config: ConfigService,
  ) {}

  @Get('by-trace/:code')
  @ApiOperation({ summary: 'Resolve contract by public trace code (internal, no JWT)' })
  @ApiResponse({ status: 200, description: 'Contract details for traceability rendering' })
  @ApiResponse({ status: 403, description: 'Forbidden - missing or invalid internal secret' })
  @ApiResponse({ status: 404, description: 'Trace code not found' })
  async getByTraceCode(
    @Param('code') code: string,
    @Headers(HEADER) internalHeader?: string,
  ): Promise<ContractDto> {
    this.assertInternalSecret(internalHeader);

    const decoded = decodeURIComponent(code);
    let contract = await this.contractsService.findByTraceabilityCode(decoded);
    if (!contract) {
      throw new NotFoundException('Không tìm thấy hợp đồng cho mã truy xuất này');
    }
    // Nếu mã thuộc trader_buyer → resolve về farmer_trader gốc
    if (contract.contractType === 'trader_buyer' && contract.sourceContractId) {
      const source = await this.contractsService.findById(contract.sourceContractId);
      if (source) contract = source;
    }
    return this.toDto(contract);
  }

  private assertInternalSecret(header?: string): void {
    const secret = this.config.get<string>('TRACEABILITY_INTERNAL_SECRET');
    if (!secret) return; // dev: bỏ qua
    if (header !== secret) {
      throw new ForbiddenException('Truy cập traceability nội bộ không hợp lệ');
    }
  }

  // Map raw entity → DTO (giống ContractsService.toDto nhưng inline để tránh phụ thuộc private).
  private toDto(entity: ContractEntity): ContractDto {
    return {
      id: entity.id,
      partyFarmerId: entity.partyFarmerId ?? undefined,
      partyTraderId: entity.partyTraderId,
      partyBuyerId: entity.partyBuyerId ?? undefined,
      partyFarmerName: entity.partyFarmerName ?? null,
      partyFarmerPhone: entity.partyFarmerPhone ?? null,
      partyTraderName: entity.partyTraderName ?? null,
      partyTraderPhone: entity.partyTraderPhone ?? null,
      partyBuyerName: entity.partyBuyerName ?? null,
      partyBuyerPhone: entity.partyBuyerPhone ?? null,
      contractType: entity.contractType,
      productId: entity.productId ?? undefined,
      standardId: entity.standardId ?? undefined,
      farmId: entity.farmId ?? undefined,
      farmName: entity.farmName ?? null,
      standardName: entity.standardName ?? null,
      quantity: Number(entity.quantity),
      unit: entity.unit,
      totalPrice: Number(entity.totalPrice),
      deposit: entity.deposit !== null ? Number(entity.deposit) : undefined,
      startDate: entity.startDate,
      endDate: entity.endDate,
      plantingDate: entity.plantingDate ?? null,
      status: entity.status,
      terms: entity.terms,
      farmerSignedAt: entity.farmerSignedAt?.toISOString(),
      traderSignedAt: entity.traderSignedAt?.toISOString(),
      buyerSignedAt: entity.buyerSignedAt?.toISOString(),
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
      sourceContractId: entity.sourceContractId ?? undefined,
      traceabilityCode: entity.traceabilityCode ?? null,
    };
  }
}
