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
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  CareLogDto,
  CareLogSyncResponse,
  CreateCareLogDto,
  CreateEvidenceDto,
  EvidenceDto,
  ListResponse,
  CurrentUser,
  JwtPayload,
} from '@trustagri/shared';
import { CareLogsService } from './care-logs.service';
import { ListCareLogsQueryDto } from './dto/list-care-logs-query.dto';
import { SyncCareLogsDto } from './dto/sync-care-logs.dto';

@ApiTags('care-logs')
@ApiBearerAuth()
@Controller('farms/:farmId/care-logs')
export class CareLogsController {
  constructor(private readonly careLogsService: CareLogsService) {}

  /**
   * GET /api/v1/farms/:farmId/care-logs
   * Danh sách nhật ký chăm sóc có phân trang.
   */
  @Get()
  @ApiOperation({ summary: 'List care logs for a farm with pagination' })
  @ApiResponse({ status: 200, description: 'Paginated list of care logs' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Farm not found' })
  list(
    @Param('farmId', new ParseUUIDPipe({ version: '4' })) farmId: string,
    @Query() query: ListCareLogsQueryDto,
  ): Promise<ListResponse<CareLogDto>> {
    return this.careLogsService.listCareLogs(farmId, query);
  }

  /**
   * POST /api/v1/farms/:farmId/care-logs
   * Tạo một nhật ký chăm sóc (chỉ chủ vườn).
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a care log entry for a farm (farm owner only)' })
  @ApiResponse({ status: 201, description: 'Care log created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - only farm owner' })
  create(
    @Param('farmId', new ParseUUIDPipe({ version: '4' })) farmId: string,
    @Body() dto: CreateCareLogDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<CareLogDto> {
    return this.careLogsService.createCareLog(farmId, dto, user.sub);
  }

  /**
   * POST /api/v1/farms/:farmId/care-logs/sync
   * Đồng bộ batch offline — idempotent theo clientRecordId, xử lý conflict theo performedAt.
   */
  @Post('sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Batch sync offline care logs (idempotent by clientRecordId)' })
  @ApiResponse({ status: 200, description: 'Sync results per item (accepted/conflicted/rejected)' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  sync(
    @Param('farmId', new ParseUUIDPipe({ version: '4' })) farmId: string,
    @Body() dto: SyncCareLogsDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<CareLogSyncResponse> {
    return this.careLogsService.syncCareLogs(farmId, dto, user.sub);
  }
}

@ApiTags('evidence')
@ApiBearerAuth()
@Controller('farms/:farmId/evidence')
export class EvidenceController {
  constructor(private readonly careLogsService: CareLogsService) {}

  /**
   * POST /api/v1/farms/:farmId/evidence
   * Lưu metadata minh chứng (URL đã upload từ FE).
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Save evidence metadata (file URL pre-uploaded by client)' })
  @ApiResponse({ status: 201, description: 'Evidence metadata saved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - only farm owner' })
  create(
    @Param('farmId', new ParseUUIDPipe({ version: '4' })) farmId: string,
    @Body() dto: CreateEvidenceDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<EvidenceDto> {
    return this.careLogsService.createEvidence(farmId, dto, user.sub);
  }
}
