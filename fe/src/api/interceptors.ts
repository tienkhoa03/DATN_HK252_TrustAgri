import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import type { AxiosError } from 'axios';
import { getDefaultStore } from 'jotai';
import { ENV } from '@/config/env';
import { accessTokenAtom, authSessionAtom } from '@/state/authAtoms';
import { parseAxiosError, isUnauthorized, type ErrorBody } from './errors';

/**
 * Attaches JWT bearer token to every outgoing request.
 * Reads from the Jotai store so it always picks up the latest token.
 */
function requestInterceptor(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
  config.headers = config.headers ?? {};
  config.headers['X-Client-Api-Contract-Version'] = ENV.API_CONTRACT_VERSION;
  if (config.skipAuth) {
    delete config.headers['Authorization'];
    return config;
  }
  const store = getDefaultStore();
  const token = store.get(accessTokenAtom);
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
}

/**
 * Normalizes all Axios errors into ApiError.
 * Clears auth state on 401 so the UI can redirect to login.
 */
async function responseErrorInterceptor(error: AxiosError<ErrorBody>): Promise<never> {
  const apiError = parseAxiosError(error);

  if (isUnauthorized(apiError)) {
    const store = getDefaultStore();
    store.set(authSessionAtom, null);
  }

  return Promise.reject(apiError);
}

/** Registers all interceptors on the provided Axios instance. */
export function registerInterceptors(instance: AxiosInstance): void {
  instance.interceptors.request.use(requestInterceptor);
  instance.interceptors.response.use(
    (res: AxiosResponse) => res,
    responseErrorInterceptor,
  );
}
