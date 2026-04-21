import type { AxiosError } from 'axios';
import { ApiError, parseAxiosError, type ErrorBody } from '@/api/errors';

describe('parseAxiosError', () => {
  it('maps backend ErrorBody to ApiError', () => {
    const err = {
      message: 'Request failed',
      response: {
        status: 403,
        data: {
          error: {
            code: 'FORBIDDEN',
            message: 'Không có quyền',
            timestamp: '2026-04-21T10:00:00.000Z',
            requestId: 'req-1',
          },
        },
      },
    } as AxiosError<ErrorBody>;
    const e = parseAxiosError(err);
    expect(e).toBeInstanceOf(ApiError);
    expect(e.code).toBe('FORBIDDEN');
    expect(e.httpStatus).toBe(403);
    expect(e.message).toBe('Không có quyền');
    expect(e.requestId).toBe('req-1');
  });

  it('uses NETWORK_ERROR when there is no HTTP response', () => {
    const err = {
      message: 'Network Error',
      request: {},
    } as AxiosError<ErrorBody>;
    const e = parseAxiosError(err);
    expect(e.code).toBe('NETWORK_ERROR');
    expect(e.httpStatus).toBe(0);
  });

  it('falls back to UNKNOWN when error code is absent in body', () => {
    const err = {
      message: 'Bad',
      response: {
        status: 500,
        data: {} as ErrorBody,
      },
    } as AxiosError<ErrorBody>;
    const e = parseAxiosError(err);
    expect(e.code).toBe('UNKNOWN');
  });
});
