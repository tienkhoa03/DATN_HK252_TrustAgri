import { BadRequestException } from '@nestjs/common';
import { ArgumentsHost } from '@nestjs/common';
import { GlobalHttpExceptionFilter } from '@trustagri/shared';

describe('GlobalHttpExceptionFilter → ErrorResponse (design.md §1.2)', () => {
  it('maps HttpException to ErrorResponse shape', () => {
    const filter = new GlobalHttpExceptionFilter();
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const res = { status };
    const req = {
      headers: { 'x-request-id': 'rid-contract' },
      requestId: 'rid-contract',
    };
    const host = {
      switchToHttp: () => ({
        getResponse: () => res,
        getRequest: () => req,
      }),
    } as unknown as ArgumentsHost;

    filter.catch(new BadRequestException('Dữ liệu không hợp lệ'), host);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          code: 'INVALID_INPUT',
          message: expect.any(String),
          timestamp: expect.any(String),
          requestId: 'rid-contract',
        }),
      }),
    );
  });
});
