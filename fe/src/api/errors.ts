import type { AxiosError } from 'axios';

/**
 * Mirrors the backend ErrorResponse contract (design.md §1.2).
 * All fields are camelCase as mandated by the API convention.
 */
export interface ErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
    timestamp: string;
    requestId: string;
  };
}

/**
 * Well-typed API error codes emitted by the backend.
 */
export type ApiErrorCode =
  | 'INVALID_INPUT'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMIT_EXCEEDED'
  | 'INTERNAL_ERROR'
  | 'SERVICE_UNAVAILABLE'
  | 'NETWORK_ERROR'
  | 'UNKNOWN';

/**
 * Normalized error thrown by the service layer.
 * Constructed from the backend ErrorBody or from network failures.
 */
export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly httpStatus: number;
  readonly details?: unknown;
  readonly timestamp: string;
  readonly requestId: string;

  constructor(
    code: ApiErrorCode,
    message: string,
    httpStatus: number,
    details?: unknown,
    timestamp?: string,
    requestId?: string,
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.httpStatus = httpStatus;
    this.details = details;
    this.timestamp = timestamp ?? new Date().toISOString();
    this.requestId = requestId ?? '';
  }
}

/**
 * Parses an Axios error into a typed ApiError.
 * Falls back to NETWORK_ERROR when there is no HTTP response.
 */
export function parseAxiosError(err: AxiosError<ErrorBody>): ApiError {
  if (err.response) {
    const body = err.response.data;
    const code = (body?.error?.code as ApiErrorCode) ?? 'UNKNOWN';
    const message = body?.error?.message ?? err.message;
    return new ApiError(
      code,
      message,
      err.response.status,
      body?.error?.details,
      body?.error?.timestamp,
      body?.error?.requestId,
    );
  }

  if (err.request) {
    return new ApiError('NETWORK_ERROR', 'Không có phản hồi từ máy chủ. Vui lòng kiểm tra kết nối mạng.', 0);
  }

  return new ApiError('UNKNOWN', err.message, 0);
}

/** Returns true when the error is a 401 Unauthorized. */
export const isUnauthorized = (err: unknown): err is ApiError =>
  err instanceof ApiError && err.httpStatus === 401;

/** Returns true when the error is a 429 Too Many Requests. */
export const isRateLimited = (err: unknown): err is ApiError =>
  err instanceof ApiError && err.httpStatus === 429;
