import { Injectable, LoggerService, Scope } from '@nestjs/common';

/**
 * Structured logger với correlation requestId (design.md §8)
 * Trong production nên thay bằng pino hoặc winston
 */
@Injectable({ scope: Scope.TRANSIENT })
export class AppLoggerService implements LoggerService {
  private context?: string;

  setContext(context: string): void {
    this.context = context;
  }

  private format(
    level: string,
    message: unknown,
    meta?: Record<string, unknown>,
  ): string {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      context: this.context,
      message,
      ...meta,
    });
  }

  log(message: unknown, ...optionalParams: unknown[]): void {
    console.log(this.format('info', message, this.extractMeta(optionalParams)));
  }

  error(message: unknown, ...optionalParams: unknown[]): void {
    console.error(
      this.format('error', message, this.extractMeta(optionalParams)),
    );
  }

  warn(message: unknown, ...optionalParams: unknown[]): void {
    console.warn(this.format('warn', message, this.extractMeta(optionalParams)));
  }

  debug(message: unknown, ...optionalParams: unknown[]): void {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(
        this.format('debug', message, this.extractMeta(optionalParams)),
      );
    }
  }

  verbose(message: unknown, ...optionalParams: unknown[]): void {
    console.log(
      this.format('verbose', message, this.extractMeta(optionalParams)),
    );
  }

  private extractMeta(params: unknown[]): Record<string, unknown> {
    if (params.length === 0) return {};
    if (typeof params[0] === 'object' && params[0] !== null) {
      return params[0] as Record<string, unknown>;
    }
    return { extra: params };
  }
}
