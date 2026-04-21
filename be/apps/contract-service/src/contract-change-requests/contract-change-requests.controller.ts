import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import {
  ContractChangeRequestDto,
  CreateContractChangeRequestDto,
  CurrentUser,
  JwtPayload,
  Roles,
} from '@trustagri/shared';
import { ContractChangeRequestsService } from './contract-change-requests.service';

/**
 * GET  /api/v1/contracts/:id/change-requests
 * POST /api/v1/contracts/:id/change-requests
 * POST /api/v1/contracts/:id/change-requests/:changeId/accept
 * POST /api/v1/contracts/:id/change-requests/:changeId/reject
 */
@Controller('contracts')
export class ContractChangeRequestsController {
  constructor(
    private readonly contractChangeRequestsService: ContractChangeRequestsService,
  ) {}

  @Get(':id/change-requests')
  @Roles('farmer', 'trader', 'buyer', 'admin')
  listChangeRequests(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<ContractChangeRequestDto[]> {
    return this.contractChangeRequestsService.list(id, user);
  }

  @Post(':id/change-requests')
  @HttpCode(HttpStatus.CREATED)
  @Roles('farmer', 'trader', 'buyer', 'admin')
  createChangeRequest(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: CreateContractChangeRequestDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ContractChangeRequestDto> {
    return this.contractChangeRequestsService.create(id, dto, user);
  }

  @Post(':id/change-requests/:changeId/accept')
  @HttpCode(HttpStatus.OK)
  @Roles('farmer', 'trader', 'buyer', 'admin')
  acceptChangeRequest(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('changeId', new ParseUUIDPipe({ version: '4' })) changeId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<ContractChangeRequestDto> {
    return this.contractChangeRequestsService.accept(id, changeId, user);
  }

  @Post(':id/change-requests/:changeId/reject')
  @HttpCode(HttpStatus.OK)
  @Roles('farmer', 'trader', 'buyer', 'admin')
  rejectChangeRequest(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('changeId', new ParseUUIDPipe({ version: '4' })) changeId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<ContractChangeRequestDto> {
    return this.contractChangeRequestsService.reject(id, changeId, user);
  }
}
