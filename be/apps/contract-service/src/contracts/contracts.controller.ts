import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  Headers,
} from '@nestjs/common';
import {
  ContractDto,
  ComplianceDto,
  CreateContractDto,
  ListResponse,
  CurrentUser,
  JwtPayload,
  Roles,
} from '@trustagri/shared';
import { ContractsService, type ContractAuditLogEntryDto } from './contracts.service';
import { ComplianceService } from './compliance.service';
import { ContractQueryDto } from './dto/contract-query.dto';

/**
 * Hợp đồng
 *
 * GET  /api/v1/contracts              — danh sách (lọc role, status, from, to, phân trang)
 * GET  /api/v1/contracts/:id/audit-logs — nhật ký thay đổi trạng thái
 * GET  /api/v1/contracts/:id/compliance — đối chiếu tuân thủ quy trình (FR-T11)
 * GET  /api/v1/contracts/:id          — chi tiết
 * POST /api/v1/contracts              — trader / admin tạo thủ công
 */
@Controller('contracts')
export class ContractsController {
  constructor(
    private readonly contractsService: ContractsService,
    private readonly complianceService: ComplianceService,
  ) {}

  @Get()
  @Roles('farmer', 'trader', 'buyer', 'admin')
  listContracts(
    @Query() query: ContractQueryDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ListResponse<ContractDto>> {
    return this.contractsService.list(query, user);
  }

  @Get(':id/audit-logs')
  @Roles('farmer', 'trader', 'buyer', 'admin')
  listAuditLogs(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<ContractAuditLogEntryDto[]> {
    return this.contractsService.listAuditLogs(id, user);
  }

  @Get(':id/compliance')
  @Roles('farmer', 'trader', 'buyer', 'admin')
  getCompliance(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() user: JwtPayload,
    @Headers('authorization') authorization?: string,
  ): Promise<ComplianceDto> {
    return this.complianceService.getCompliance(id, user, authorization);
  }

  @Get(':id')
  @Roles('farmer', 'trader', 'buyer', 'admin')
  getContract(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<ContractDto> {
    return this.contractsService.getById(id, user);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('trader', 'admin')
  createContract(
    @Body() dto: CreateContractDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ContractDto> {
    return this.contractsService.create(dto, user);
  }
}
