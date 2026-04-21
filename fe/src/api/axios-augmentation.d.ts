import 'axios';

declare module 'axios' {
  /** Khi true, interceptor không gắn header Authorization (endpoint public như traceability QR). */
  export interface AxiosRequestConfig {
    skipAuth?: boolean;
  }

  export interface InternalAxiosRequestConfig {
    skipAuth?: boolean;
  }
}
