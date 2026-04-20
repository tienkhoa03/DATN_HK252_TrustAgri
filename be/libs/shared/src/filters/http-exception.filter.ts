import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorResponse } from '../dto/common.dto';

/**
 * Global exception filter — maps mọi exception sang ErrorResponse chuẩn (design.md §1.2)
 */
@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalHttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const requestId =
      (request.headers['x-request-id'] as string) ?? 'unknown';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let message = 'Đã xảy ra lỗi nội bộ';
    let details: unknown;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      code = this.resolveErrorCode(status);
      message = this.resolveMessage(exceptionResponse, status);
      details = this.resolveDetails(exceptionResponse);
    } else if (exception instanceof Error) {
      this.logger.error(
        `Unhandled error: ${exception.message}`,
        exception.stack,
        { requestId },
      );
    }

    const errorBody: ErrorResponse = {
      error: {
        code,
        message,
        details,
        timestamp: new Date().toISOString(),
        requestId,
      },
    };

    response.status(status).json(errorBody);
  }

  private resolveErrorCode(status: number): string {
    const map: Record<number, string> = {
      400: 'INVALID_INPUT',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      429: 'RATE_LIMIT_EXCEEDED',
      500: 'INTERNAL_ERROR',
      503: 'SERVICE_UNAVAILABLE',
    };
    return map[status] ?? 'INTERNAL_ERROR';
  }

  private resolveMessage(exceptionResponse: unknown, status: number): string {
    if (typeof exceptionResponse === 'string') return exceptionResponse;
    if (
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null &&
      'message' in exceptionResponse
    ) {
      const msg = (exceptionResponse as { message: unknown }).message;
      if (typeof msg === 'string') return msg;
      if (Array.isArray(msg)) return msg[0] as string;
    }
    const defaults: Record<number, string> = {
      400: 'Dữ liệu đầu vào không hợp lệ',
      401: 'Bạn chưa đăng nhập hoặc phiên đã hết hạn',
      403: 'Bạn không có quyền thực hiện hành động này',
      404: 'Không tìm thấy tài nguyên',
      409: 'Xung đột trạng thái dữ liệu',
      429: 'Quá nhiều yêu cầu, vui lòng thử lại sau',
      503: 'Dịch vụ phụ thuộc không khả dụng',
    };
    return defaults[status] ?? 'Đã xảy ra lỗi nội bộ';
  }

  private resolveDetails(exceptionResponse: unknown): unknown {
    if (
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null &&
      'message' in exceptionResponse
    ) {
      const msg = (exceptionResponse as { message: unknown }).message;
      if (Array.isArray(msg) && msg.length > 1) return msg;
    }
    return undefined;
  }
}
