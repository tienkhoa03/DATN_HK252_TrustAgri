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
import {
  ProposalDto,
  CreateProposalDto,
  ListResponse,
  CurrentUser,
  JwtPayload,
  Roles,
} from '@trustagri/shared';
import { ProposalsService } from './proposals.service';
import { ProposalQueryDto } from './dto/proposal-query.dto';

/**
 * Đề xuất của thương lái phản hồi nhu cầu mua hàng
 *
 * GET  /api/v1/proposals              — danh sách (buyer/trader)
 * POST /api/v1/proposals              — trader, gửi đề xuất
 * POST /api/v1/proposals/:id/accept   — buyer, chấp nhận → tạo hợp đồng
 * POST /api/v1/proposals/:id/reject   — buyer, từ chối
 */
@Controller('proposals')
export class ProposalsController {
  constructor(private readonly proposalsService: ProposalsService) {}

  /**
   * GET /api/v1/proposals
   */
  @Get()
  @Roles('buyer', 'trader')
  listProposals(
    @Query() query: ProposalQueryDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ListResponse<ProposalDto>> {
    return this.proposalsService.listProposals(query, user.sub, user.role);
  }

  /**
   * POST /api/v1/proposals
   * Trader gửi đề xuất cho một buying request.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('trader')
  createProposal(
    @Body() dto: CreateProposalDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ProposalDto> {
    return this.proposalsService.createProposal(dto, user.sub);
  }

  /**
   * POST /api/v1/proposals/:id/accept
   * Buyer chấp nhận đề xuất → trạng thái accepted và tạo hợp đồng.
   */
  @Post(':id/accept')
  @HttpCode(HttpStatus.OK)
  @Roles('buyer')
  acceptProposal(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<ProposalDto> {
    return this.proposalsService.acceptProposal(id, user.sub);
  }

  /**
   * POST /api/v1/proposals/:id/reject
   * Buyer từ chối đề xuất.
   */
  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  @Roles('buyer')
  rejectProposal(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<ProposalDto> {
    return this.proposalsService.rejectProposal(id, user.sub);
  }
}
