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
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
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
@ApiTags('contract-change-requests')
@ApiBearerAuth()
@Controller('contracts')
export class ContractChangeRequestsController {
  constructor(
    private readonly contractChangeRequestsService: ContractChangeRequestsService,
  ) {}

  @Get(':id/change-requests')
  @Roles('farmer', 'trader', 'buyer', 'admin')
  @ApiOperation({ summary: 'List change requests for a contract' })
  @ApiResponse({ status: 200, description: 'List of contract change requests' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Contract not found' })
  listChangeRequests(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<ContractChangeRequestDto[]> {
    return this.contractChangeRequestsService.list(id, user);
  }

  @Post(':id/change-requests')
  @HttpCode(HttpStatus.CREATED)
  @Roles('farmer', 'trader', 'buyer', 'admin')
  @ApiOperation({ summary: 'Submit a change request for a contract' })
  @ApiResponse({ status: 201, description: 'Change request submitted with pending status' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Contract not found' })
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
  @ApiOperation({ summary: 'Accept a contract change request (counterparty)' })
  @ApiResponse({ status: 200, description: 'Change request accepted and contract updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - only counterparty can accept' })
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
  @ApiOperation({ summary: 'Reject a contract change request (counterparty)' })
  @ApiResponse({ status: 200, description: 'Change request rejected' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - only counterparty can reject' })
  rejectChangeRequest(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('changeId', new ParseUUIDPipe({ version: '4' })) changeId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<ContractChangeRequestDto> {
    return this.contractChangeRequestsService.reject(id, changeId, user);
  }
}
