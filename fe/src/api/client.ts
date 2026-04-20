import axios from 'axios';
import { ENV } from '@/config/env';
import { registerInterceptors } from './interceptors';

/**
 * Singleton Axios instance used by all service modules.
 * - baseURL resolves to VITE_API_BASE_URL (set in .env).
 * - 15-second timeout (mobile-appropriate).
 * - JSON Content-Type default.
 */
const apiClient = axios.create({
  baseURL: ENV.API_BASE_URL,
  timeout: ENV.REQUEST_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  },
});

registerInterceptors(apiClient);

export default apiClient;
