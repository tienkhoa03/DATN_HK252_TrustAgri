/**
 * monitoringSocket — WebSocket client cho Monitoring Service.
 *
 * Spec (design.md §4.5):
 *   WS /ws/monitoring — đăng ký sự kiện `subscribe_farm`
 *   Server push: sự kiện `sensor_update` chứa SensorReadingDto
 *
 * Luồng:
 *   1. connect() với Bearer token trong auth option.
 *   2. subscribeToFarm(farmId) — emit `subscribe_farm`.
 *   3. Mỗi `sensor_update` → gọi callback onUpdate(reading).
 *   4. unsubscribeFromFarm(farmId) — emit `unsubscribe_farm`.
 *   5. disconnect() khi app unmount.
 *
 * Singleton: tái sử dụng một socket duy nhất cho mọi màn hình.
 */

import { io, Socket } from 'socket.io-client';
import { getDefaultStore } from 'jotai';
import { accessTokenAtom } from '@/state/authAtoms';
import type { SensorReadingDto, AlertDto } from '@/services/monitoringService';
import { ENV } from '@/config/env';

// ── Derive WebSocket origin từ VITE_API_BASE_URL ──────────────────────────────
// Ví dụ: "http://localhost:3006/api/v1" → "http://localhost:3006"
const WS_ORIGIN = ENV.API_BASE_URL.replace(/\/api\/v1\/?$/, '');

export type SensorUpdateCallback = (reading: SensorReadingDto) => void;
export type AlertCreatedCallback = (alert: AlertDto) => void;

// ── Internal state ────────────────────────────────────────────────────────────

let socket: Socket | null = null;
const subscribedFarms = new Set<string>();
const callbacks = new Map<string, Set<SensorUpdateCallback>>();
const alertCallbacks = new Map<string, Set<AlertCreatedCallback>>();

// Disconnect and clear socket whenever the access token changes (logout / re-login)
getDefaultStore().sub(accessTokenAtom, () => {
  socket?.disconnect();
  socket = null;
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function getOrCreateSocket(): Socket {
  if (socket && socket.connected) return socket;

  const store = getDefaultStore();
  const token = store.get(accessTokenAtom);

  socket = io(`${WS_ORIGIN}/ws/monitoring`, {
    transports: ['websocket'],
    auth: token ? { token: `Bearer ${token}` } : undefined,
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 2000,
    reconnectionAttempts: Infinity,
  });

  socket.on('connect', () => {
    // Re-subscribe tất cả farm sau khi reconnect
    for (const farmId of subscribedFarms) {
      socket!.emit('subscribe_farm', { farmId });
    }
  });

  socket.on('sensor_update', (reading: SensorReadingDto) => {
    const cbs = callbacks.get(reading.farmId);
    if (cbs) {
      for (const cb of cbs) cb(reading);
    }
  });

  // Server pushes sự kiện alert.created khi phát hiện giá trị vượt ngưỡng
  socket.on('alert_created', (alert: AlertDto) => {
    const cbs = alertCallbacks.get(alert.farmId);
    if (cbs) {
      for (const cb of cbs) cb(alert);
    }
  });

  socket.on('connect_error', (err) => {
    console.warn('[monitoringSocket] connect_error:', err.message);
  });

  return socket;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Đăng ký nhận sensor_update cho một farm.
 * Gọi lại khi component mount.
 * @returns cleanup function — gọi khi component unmount.
 */
export function subscribeToFarm(
  farmId: string,
  onUpdate: SensorUpdateCallback,
): () => void {
  const sock = getOrCreateSocket();

  if (!callbacks.has(farmId)) callbacks.set(farmId, new Set());
  callbacks.get(farmId)!.add(onUpdate);

  if (!subscribedFarms.has(farmId)) {
    subscribedFarms.add(farmId);
    sock.emit('subscribe_farm', { farmId });
  }

  return () => {
    const cbs = callbacks.get(farmId);
    if (cbs) {
      cbs.delete(onUpdate);
      if (cbs.size === 0) {
        callbacks.delete(farmId);
        subscribedFarms.delete(farmId);
        socket?.emit('unsubscribe_farm', { farmId });
      }
    }
  };
}

/**
 * Đăng ký nhận sự kiện alert_created cho một farm.
 * Server push khi Monitoring Service phát hiện giá trị vượt ngưỡng.
 * @returns cleanup function — gọi khi component unmount.
 */
export function subscribeToFarmAlerts(
  farmId: string,
  onAlert: AlertCreatedCallback,
): () => void {
  if (!alertCallbacks.has(farmId)) alertCallbacks.set(farmId, new Set());
  alertCallbacks.get(farmId)!.add(onAlert);

  // Đảm bảo socket đang kết nối (có thể không có sensor subscription trước đó)
  getOrCreateSocket();

  return () => {
    const cbs = alertCallbacks.get(farmId);
    if (cbs) {
      cbs.delete(onAlert);
      if (cbs.size === 0) alertCallbacks.delete(farmId);
    }
  };
}

/** Ngắt kết nối hoàn toàn (dùng khi logout). */
export function disconnectMonitoringSocket(): void {
  socket?.disconnect();
  socket = null;
  subscribedFarms.clear();
  callbacks.clear();
  alertCallbacks.clear();
}
