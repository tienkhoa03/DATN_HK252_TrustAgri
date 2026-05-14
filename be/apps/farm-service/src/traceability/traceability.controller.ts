import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public, TraceabilityDto } from '@trustagri/shared';
import { TraceabilityService } from './traceability.service';

/**
 * GET /api/v1/traceability/qr/:code — công khai, không JWT (design.md §4.3 FR-G01)
 */
@ApiTags('traceability')
@Controller('traceability')
@Public()
export class TraceabilityController {
  constructor(private readonly traceabilityService: TraceabilityService) {}

  @Get('qr/:code')
  @ApiOperation({ summary: 'Public QR code traceability lookup (no auth required)' })
  @ApiResponse({ status: 200, description: 'Traceability data including farm, care logs, and sensor chart' })
  @ApiResponse({ status: 404, description: 'Product code not found' })
  getByQrCode(@Param('code') code: string): Promise<TraceabilityDto> {
    return this.traceabilityService.getByQrCode(decodeURIComponent(code));
  }
}
