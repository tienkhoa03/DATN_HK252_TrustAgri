import { Controller, Get, Param } from '@nestjs/common';
import { Public, TraceabilityDto } from '@trustagri/shared';
import { TraceabilityService } from './traceability.service';

/**
 * GET /api/v1/traceability/qr/:code — công khai, không JWT (design.md §4.3 FR-G01)
 */
@Controller('traceability')
@Public()
export class TraceabilityController {
  constructor(private readonly traceabilityService: TraceabilityService) {}

  @Get('qr/:code')
  getByQrCode(@Param('code') code: string): Promise<TraceabilityDto> {
    return this.traceabilityService.getByQrCode(decodeURIComponent(code));
  }
}
