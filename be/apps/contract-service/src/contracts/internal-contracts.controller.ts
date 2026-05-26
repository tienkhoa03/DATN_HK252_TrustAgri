import { Controller, Get, NotFoundException, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ComplianceCertificateDto, InternalContractRefDto, Public } from '@trustagri/shared';
import { ComplianceService } from './compliance.service';
import { TraceabilityInternalGuard } from './internal.guard';

/**
 * Endpoints nội bộ cho truy xuất nguồn gốc QR (không JWT).
 * Gọi từ farm-service với header X-Traceability-Internal.
 */
@ApiTags('internal-contracts')
@Controller('contracts/internal')
@Public()
@UseGuards(TraceabilityInternalGuard)
export class InternalContractsController {
  constructor(private readonly complianceService: ComplianceService) {}

  @Get('farms/:farmId/active-compliance')
  @ApiOperation({ summary: 'Get active contract compliance snapshot for a farm (internal, no auth)' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 403 })
  @ApiResponse({ status: 404 })
  getActiveCompliance(@Param('farmId') farmId: string): Promise<ComplianceCertificateDto> {
    return this.complianceService.getActiveComplianceForFarm(farmId);
  }

  @Get('by-trace-code/:code')
  @ApiOperation({ summary: 'Resolve contract by LOT traceability code (internal)' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404 })
  async getByTraceCode(@Param('code') code: string): Promise<InternalContractRefDto> {
    const ref = await this.complianceService.getContractRefByCode(code);
    if (!ref) throw new NotFoundException('Không tìm thấy hợp đồng cho mã này');
    return ref;
  }

  @Get('farms/:farmId/active-contract')
  @ApiOperation({ summary: 'Get active farmer_trader contract for a farm (internal)' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404 })
  async getActiveContractForFarm(@Param('farmId') farmId: string): Promise<InternalContractRefDto> {
    const ref = await this.complianceService.getActiveContractRefForFarm(farmId);
    if (!ref) throw new NotFoundException('Không có hợp đồng active cho vườn này');
    return ref;
  }

  @Get(':contractId/compliance')
  @ApiOperation({ summary: 'Get compliance certificate by contractId (internal, supports completed contracts)' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404 })
  getComplianceByContractId(@Param('contractId') contractId: string): Promise<ComplianceCertificateDto> {
    return this.complianceService.getComplianceCertificateByContractId(contractId);
  }
}
