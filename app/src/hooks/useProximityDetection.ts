import { useCallback, useEffect, useRef } from 'react';
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
 * Owns the BLE lifecycle for two independent actions:
 * - "quiero ser detectado" (isDetectable) broadcasts your profile so others
 *   can find you. It says nothing about whether you're looking for anyone.
 * - "buscar gente" (isSearching) scans for others broadcasting the same way.
 *   It's a deliberate, on-demand action - opening the app never starts a
 *   scan by itself, and only people who separately turned on their own
 *   "quiero ser detectado" ever show up in it.
 * Mount this once near the root of the app.
 */
export function useProximityDetection() {
  const profile = useAppStore((state) => state.profile);
  const isDetectable = useAppStore((state) => state.isDetectable);
  const isSearching = useAppStore((state) => state.isSearching);
  const upsertDetectedPerson = useAppStore((state) => state.upsertDetectedPerson);
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
      stopAdvertising();
      return;
    }

    let cancelled = false;

    (async () => {
      const granted = await ensurePermissions();
      if (!granted || cancelled) return;
      await startAdvertising(profile);
    })();

    return () => {
      cancelled = true;
      stopAdvertising();
    };
    // profile changes are picked up next time the toggle cycles, not live -
    // re-broadcasting on every keystroke would spam the radio.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDetectable]);

  useEffect(() => {
    if (!isSearching) {
      stopScanning();
      return;
    }

    let cancelled = false;

    (async () => {
      const granted = await ensurePermissions();
      if (!granted || cancelled) return;

      startScanning(({ id, rssi, name, emoji, phone }) => {
        const distanceMeters = rssiToDistanceMeters(rssi);
        upsertDetectedPerson({
          id,
          name,
          emoji,
          phone,
          rssi,
          distanceMeters,
          proximity: distanceToProximity(distanceMeters),
          detectedAt: Date.now(),
        });
      });
    })();

    return () => {
      cancelled = true;
      stopScanning();
    };
  }, [isSearching, ensurePermissions, upsertDetectedPerson]);
}
