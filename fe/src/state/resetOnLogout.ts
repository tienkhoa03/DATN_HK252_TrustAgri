import { getDefaultStore } from 'jotai';
import { latestSensorMapAtom, farmAlertBadgeAtom } from './monitoringAtoms';

/**
 * Clears all user-specific Jotai state on logout to prevent data leaking
 * between users on shared devices.
 */
export function resetAllStateOnLogout(): void {
  const store = getDefaultStore();
  store.set(latestSensorMapAtom, new Map());
  store.set(farmAlertBadgeAtom, new Map());
}
