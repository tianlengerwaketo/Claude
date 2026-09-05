import { useCallback, useEffect, useRef } from 'react';
import { Alert, Linking } from 'react-native';
import {
  destroyBleManager,
  onBluetoothStateChange,
  startAdvertising,
  startScanning,
  stopAdvertising,
  stopScanning,
} from '../services/bleService';
import { requestBlePermissions, type BleRole } from '../services/permissions';
import { getPresence, markNotDetectable, publishPresence } from '../services/presenceService';
import { useAppStore } from '../store/useAppStore';
import { distanceToProximity, rssiToDistanceMeters } from '../utils/distance';

/** How often to refresh our own presence doc while detectable, so a killed app doesn't look "on" forever. */
const PRESENCE_HEARTBEAT_MS = 60_000;

function showPermissionDeniedAlert(permanentlyDenied: boolean) {
  if (permanentlyDenied) {
    Alert.alert(
      'Permiso de Bluetooth necesario',
      'Denegaste el permiso de Bluetooth de forma permanente. Para usar esta app, activalo manualmente en Ajustes > Apps > Gente Cerca > Permisos.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Abrir Ajustes', onPress: () => Linking.openSettings() },
      ]
    );
    return;
  }
  Alert.alert(
    'Permiso de Bluetooth necesario',
    'Esta app necesita permiso de Bluetooth para detectar o ser detectada. Volvé a intentarlo y aceptá el permiso.'
  );
}

/**
 * Owns the BLE lifecycle for two independent actions:
 * - "quiero ser detectado" (isDetectable) broadcasts your device token so
 *   others can find you, and mirrors that state to Firestore (presence/
 *   {token}) so people who already found you can tell whether they're still
 *   allowed to message you, even after you're both out of Bluetooth range.
 * - "buscar gente" (isSearching) scans for others broadcasting the same way.
 *   It's a deliberate, on-demand action - opening the app never starts a
 *   scan by itself, and only people who separately turned on their own
 *   "quiero ser detectado" ever show up in it.
 * Mount this once near the root of the app.
 */
export function useProximityDetection() {
  const deviceToken = useAppStore((state) => state.deviceToken);
  const hasHydrated = useAppStore((state) => state.hasHydrated);
  const profile = useAppStore((state) => state.profile);
  const isDetectable = useAppStore((state) => state.isDetectable);
  const isSearching = useAppStore((state) => state.isSearching);
  const upsertDetectedPerson = useAppStore((state) => state.upsertDetectedPerson);
  const setDetectable = useAppStore((state) => state.setDetectable);
  const setSearching = useAppStore((state) => state.setSearching);
  const setBluetoothOn = useAppStore((state) => state.setBluetoothOn);

  // Advertising and scanning need different Android permissions and are
  // requested independently, so a problem with one (e.g. a permission
  // missing from the manifest) never blocks the other.
  const permissionsGrantedByRole = useRef<Record<BleRole, boolean>>({ advertise: false, scan: false });
  const scanErrorShown = useRef(false);
  // Tokens we've already resolved a name/emoji for (or are resolving), so a
  // burst of repeated adverts from someone already on the list doesn't
  // trigger a Firestore read per blip.
  const knownTokens = useRef<Set<string>>(new Set());

  const ensurePermissions = useCallback(async (role: BleRole) => {
    if (permissionsGrantedByRole.current[role]) return true;
    const result = await requestBlePermissions(role);
    permissionsGrantedByRole.current[role] = result.granted;
    if (!result.granted) showPermissionDeniedAlert(result.permanentlyDenied);
    return result.granted;
  }, []);

  useEffect(() => {
    const unsubscribe = onBluetoothStateChange(setBluetoothOn);
    return unsubscribe;
  }, [setBluetoothOn]);

  useEffect(() => destroyBleManager, []);

  useEffect(() => {
    // Wait for AsyncStorage hydration so we never advertise/publish under a
    // throwaway token generated before the real persisted one loaded.
    if (!hasHydrated || !isDetectable) {
      stopAdvertising();
      return;
    }

    let cancelled = false;

    (async () => {
      const granted = await ensurePermissions('advertise');
      if (!granted) {
        if (!cancelled) setDetectable(false);
        return;
      }
      if (cancelled) return;

      try {
        await startAdvertising(deviceToken);
      } catch (error) {
        if (cancelled) return;
        console.warn('[useProximityDetection] startAdvertising failed', error);
        Alert.alert(
          'No se pudo activar "Quiero ser detectado"',
          `Este teléfono no pudo empezar a transmitir por Bluetooth. Algunos modelos no admiten esta función.\n\nDetalle técnico: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
        setDetectable(false);
        return;
      }

      await publishPresence(deviceToken, profile).catch((error) => {
        console.warn('[useProximityDetection] publishPresence failed', error);
      });
    })();

    const heartbeat = setInterval(() => publishPresence(deviceToken, profile).catch(() => {}), PRESENCE_HEARTBEAT_MS);

    return () => {
      cancelled = true;
      clearInterval(heartbeat);
      stopAdvertising();
      // Only reached when this effect instance actually turned advertising
      // on above, i.e. exactly on the on -> off transition (or unmount
      // while on) - never fires spuriously while already off.
      markNotDetectable(deviceToken, profile).catch(() => {});
    };
  }, [hasHydrated, isDetectable, deviceToken, profile.name, profile.emoji]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isSearching) {
      stopScanning();
      return;
    }

    let cancelled = false;

    (async () => {
      const granted = await ensurePermissions('scan');
      if (!granted) {
        if (!cancelled) setSearching(false);
        return;
      }
      if (cancelled) return;

      startScanning(async ({ token, rssi }) => {
        const distanceMeters = rssiToDistanceMeters(rssi);
        const proximity = distanceToProximity(distanceMeters);
        const detectedAt = Date.now();

        const existing = useAppStore.getState().detectedPeople[token];
        if (existing || knownTokens.current.has(token)) {
          upsertDetectedPerson({
            token,
            name: existing?.name ?? 'Alguien',
            emoji: existing?.emoji ?? '🙂',
            rssi,
            distanceMeters,
            proximity,
            detectedAt,
          });
          return;
        }

        knownTokens.current.add(token);
        const presence = await getPresence(token).catch((error) => {
          console.warn('[useProximityDetection] getPresence failed', error);
          return null;
        });
        if (cancelled) return;
        upsertDetectedPerson({
          token,
          name: presence?.name ?? 'Alguien',
          emoji: presence?.emoji ?? '🙂',
          rssi,
          distanceMeters,
          proximity,
          detectedAt,
        });
      }, (error) => {
        if (scanErrorShown.current) return;
        scanErrorShown.current = true;
        Alert.alert(
          'Error al buscar por Bluetooth',
          `Detalle técnico: ${error.message}`
        );
      });
    })();

    return () => {
      cancelled = true;
      stopScanning();
    };
  }, [isSearching, ensurePermissions, upsertDetectedPerson, setSearching]);
}
