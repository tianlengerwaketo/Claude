import { useCallback, useEffect, useRef } from 'react';
import { PRUNE_INTERVAL_MS, STALE_TIMEOUT_MS } from '../constants/ble';
import {
  destroyBleManager,
  onBluetoothStateChange,
  startAdvertising,
  startScanning,
  stopAdvertising,
  stopScanning,
} from '../services/bleService';
import { requestBlePermissions } from '../services/permissions';
import { useAppStore } from '../store/useAppStore';
import { distanceToProximity, rssiToDistanceMeters } from '../utils/distance';

/**
 * Owns the full BLE lifecycle around a single reciprocal toggle: turning
 * "quiero ser detectado" on both broadcasts your profile AND starts
 * scanning for others doing the same. Turning it off stops both and clears
 * the nearby list - you only see people while you're also visible to them.
 * Mount this once near the root of the app.
 */
export function useProximityDetection() {
  const profile = useAppStore((state) => state.profile);
  const isDetectable = useAppStore((state) => state.isDetectable);
  const upsertNearbyPerson = useAppStore((state) => state.upsertNearbyPerson);
  const pruneStalePeople = useAppStore((state) => state.pruneStalePeople);
  const clearNearbyPeople = useAppStore((state) => state.clearNearbyPeople);
  const setBluetoothOn = useAppStore((state) => state.setBluetoothOn);

  const permissionsGranted = useRef(false);

  const ensurePermissions = useCallback(async () => {
    if (permissionsGranted.current) return true;
    const granted = await requestBlePermissions();
    permissionsGranted.current = granted;
    return granted;
  }, []);

  useEffect(() => {
    const unsubscribe = onBluetoothStateChange(setBluetoothOn);
    return unsubscribe;
  }, [setBluetoothOn]);

  useEffect(() => destroyBleManager, []);

  useEffect(() => {
    if (!isDetectable) {
      stopScanning();
      stopAdvertising();
      clearNearbyPeople();
      return;
    }

    let cancelled = false;

    (async () => {
      const granted = await ensurePermissions();
      if (!granted || cancelled) return;

      await startAdvertising(profile);
      if (cancelled) return;

      startScanning(({ id, rssi, name, emoji }) => {
        const distanceMeters = rssiToDistanceMeters(rssi);
        upsertNearbyPerson({
          id,
          name,
          emoji,
          rssi,
          distanceMeters,
          proximity: distanceToProximity(distanceMeters),
          lastSeenAt: Date.now(),
        });
      });
    })();

    const pruneInterval = setInterval(() => pruneStalePeople(STALE_TIMEOUT_MS), PRUNE_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(pruneInterval);
      stopScanning();
      stopAdvertising();
    };
    // profile changes are picked up next time the toggle cycles, not live -
    // re-broadcasting on every keystroke would spam the radio.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDetectable]);
}
