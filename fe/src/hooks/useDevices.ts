/**
 * useDevices — quản lý danh sách IoT device cho 1 farm (Phase B1).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  listDevices,
  createDevice,
  updateDevice,
  deleteDevice,
  toDeviceViMessage,
  type IotDeviceDto,
  type CreateIotDeviceBody,
  type UpdateIotDeviceBody,
} from '@/services/deviceService';

export interface UseDevicesReturn {
  devices: IotDeviceDto[];
  isLoading: boolean;
  isMutating: boolean;
  error: string | null;
  reload: () => Promise<void>;
  create: (body: CreateIotDeviceBody) => Promise<IotDeviceDto | null>;
  update: (id: string, body: UpdateIotDeviceBody) => Promise<IotDeviceDto | null>;
  remove: (id: string) => Promise<boolean>;
  clearError: () => void;
}

export function useDevices(farmId: string | null | undefined): UseDevicesReturn {
  const [devices, setDevices] = useState<IotDeviceDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlightRef = useRef(false);

  const reload = useCallback(async () => {
    if (!farmId || inFlightRef.current) return;
    inFlightRef.current = true;
    setIsLoading(true);
    setError(null);
    try {
      const list = await listDevices(farmId);
      setDevices(list);
    } catch (err) {
      setError(toDeviceViMessage(err, 'list'));
    } finally {
      setIsLoading(false);
      inFlightRef.current = false;
    }
  }, [farmId]);

  useEffect(() => {
    if (farmId) void reload();
    else setDevices([]);
  }, [farmId, reload]);

  const create = useCallback(
    async (body: CreateIotDeviceBody): Promise<IotDeviceDto | null> => {
      if (!farmId) return null;
      setIsMutating(true);
      setError(null);
      try {
        const created = await createDevice(farmId, body);
        setDevices((prev) => [created, ...prev]);
        return created;
      } catch (err) {
        setError(toDeviceViMessage(err, 'create'));
        return null;
      } finally {
        setIsMutating(false);
      }
    },
    [farmId],
  );

  const update = useCallback(
    async (id: string, body: UpdateIotDeviceBody): Promise<IotDeviceDto | null> => {
      setIsMutating(true);
      setError(null);
      try {
        const updated = await updateDevice(id, body);
        setDevices((prev) => prev.map((d) => (d.id === id ? updated : d)));
        return updated;
      } catch (err) {
        setError(toDeviceViMessage(err, 'update'));
        return null;
      } finally {
        setIsMutating(false);
      }
    },
    [],
  );

  const remove = useCallback(async (id: string): Promise<boolean> => {
    setIsMutating(true);
    setError(null);
    try {
      await deleteDevice(id);
      setDevices((prev) => prev.filter((d) => d.id !== id));
      return true;
    } catch (err) {
      setError(toDeviceViMessage(err, 'delete'));
      return false;
    } finally {
      setIsMutating(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { devices, isLoading, isMutating, error, reload, create, update, remove, clearError };
}
