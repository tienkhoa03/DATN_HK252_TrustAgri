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
  Patch,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  ContractDto,
  ComplianceDto,
  CreateContractDto,
  FarmDto,
  ListResponse,
  CurrentUser,
  JwtPayload,
  Roles,
} from '@trustagri/shared';
import { ContractsService, type ContractAuditLogEntryDto } from './contracts.service';
import { ComplianceService } from './compliance.service';
import { ContractQueryDto } from './dto/contract-query.dto';
import { RejectContractDto } from './dto/reject-contract.dto';

/**
 * Hợp đồng
 *
 * GET  /api/v1/contracts              — danh sách (lọc role, status, from, to, phân trang)
 * GET  /api/v1/contracts/:id/audit-logs — nhật ký thay đổi trạng thái
 * GET  /api/v1/contracts/:id/compliance — đối chiếu tuân thủ quy trình (FR-T11)
 * GET  /api/v1/contracts/:id          — chi tiết
 * POST /api/v1/contracts              — trader / admin tạo thủ công
 */
@ApiTags('contracts')
@ApiBearerAuth()
@Controller('contracts')
export class ContractsController {
  constructor(
    private readonly contractsService: ContractsService,
    private readonly complianceService: ComplianceService,
  ) {}

  @Get()
  @Roles('farmer', 'trader', 'buyer', 'admin')
  @ApiOperation({ summary: 'List contracts filtered by role, status, and date range' })
  @ApiResponse({ status: 200, description: 'Paginated list of contracts' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  listContracts(
    @Query() query: ContractQueryDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ListResponse<ContractDto>> {
    return this.contractsService.list(query, user);
  }

  /**
   * GET /api/v1/contracts/linked-farms
   * Vườn có hợp đồng farmer_trader active với thương lái đang đăng nhập.
   */
  @Get('linked-farms')
  @Roles('trader')
  @ApiOperation({ summary: 'List farms with active farmer_trader contracts for the authenticated trader' })
  @ApiResponse({ status: 200, description: 'List of linked farms' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  listLinkedFarms(
    @CurrentUser() user: JwtPayload,
    @Headers('authorization') authorization?: string,
  ): Promise<ListResponse<FarmDto>> {
    return this.contractsService
      .listTraderLinkedFarms(user.sub, authorization)
      .then((items) => ({
        items,
        page: 1,
        limit: items.length > 0 ? items.length : 20,
        total: items.length,
      }));
  }

  @Get(':id/audit-logs')
  @Roles('farmer', 'trader', 'buyer', 'admin')
  @ApiOperation({ summary: 'Get audit log of status changes for a contract' })
  @ApiResponse({ status: 200, description: 'List of audit log entries' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Contract not found' })
  listAuditLogs(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<ContractAuditLogEntryDto[]> {
    return this.contractsService.listAuditLogs(id, user);
  }

  @Get(':id/compliance')
  @Roles('farmer', 'trader', 'buyer', 'admin')
  @ApiOperation({ summary: 'Get compliance score and deviations for a contract' })
  @ApiResponse({ status: 200, description: 'Compliance report with score and deviations' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Contract not found' })
  getCompliance(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() user: JwtPayload,
    @Headers('authorization') authorization?: string,
  ): Promise<ComplianceDto> {
    return this.complianceService.getCompliance(id, user, authorization);
  }

  @Get(':id')
  @Roles('farmer', 'trader', 'buyer', 'admin')
  @ApiOperation({ summary: 'Get contract details by ID' })
  @ApiResponse({ status: 200, description: 'Contract details' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Contract not found' })
  getContract(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<ContractDto> {
    return this.contractsService.getById(id, user);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('trader', 'admin')
  @ApiOperation({ summary: 'Create a contract manually (trader or admin only)' })
  @ApiResponse({ status: 201, description: 'Contract created, pending signatures' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - trader or admin only' })
  createContract(
    @Body() dto: CreateContractDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ContractDto> {
    return this.contractsService.create(dto, user);
  }

  /**
   * PATCH /api/v1/contracts/:id/sign
   * Bên liên quan ký hợp đồng. Khi cả 2 bên ký, status → active.
   */
  @Patch(':id/sign')
  @HttpCode(HttpStatus.OK)
  @Roles('farmer', 'trader', 'buyer')
  @ApiOperation({ summary: 'Sign a contract (activates when all parties have signed)' })
  @ApiResponse({ status: 200, description: 'Signature recorded; contract activated if all parties signed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not a party to this contract' })
  @ApiResponse({ status: 404, description: 'Contract not found' })
  signContract(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<ContractDto> {
    return this.contractsService.sign(id, user);
  }

  /**
   * POST /api/v1/contracts/:id/reject
   * Bên chưa ký từ chối hợp đồng đang chờ ký → status cancelled.
   */
  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  @Roles('farmer', 'trader', 'buyer')
  @ApiOperation({ summary: 'Reject a pending contract (unsigned party only)' })
  @ApiResponse({ status: 200, description: 'Contract cancelled' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not a party or already signed' })
  @ApiResponse({ status: 404, description: 'Contract not found' })
  @ApiResponse({ status: 409, description: 'Conflict - not pending signature or already signed' })
  rejectContract(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: RejectContractDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ContractDto> {
    return this.contractsService.reject(id, user, dto.reason);
  }
}
