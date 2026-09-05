import { PermissionsAndroid, Platform } from 'react-native';

/**
 * Requests whatever the OS needs before BLE scanning/advertising will work.
 *
 * - Android 12+ (API 31+): BLUETOOTH_SCAN and BLUETOOTH_ADVERTISE, requested
 *   with the "neverForLocation" flag on the native side (see
 *   android/app/src/main/AndroidManifest.xml) so we don't have to ask for
 *   location at all - we only use BLE, never GPS.
 * - Android <12: Bluetooth was covered by legacy permissions, but scanning
 *   for BLE devices still required ACCESS_FINE_LOCATION at the OS level.
 * - iOS: Bluetooth permission is requested implicitly by CoreBluetooth the
 *   first time it's used; there's nothing to request up front beyond having
 *   NSBluetoothAlwaysUsageDescription in Info.plist (see app.json).
 */
export interface PermissionResult {
  granted: boolean;
  /** True if at least one permission was permanently denied ("don't ask again") - re-requesting won't show a dialog again, only Settings can fix it. */
  permanentlyDenied: boolean;
}

export async function requestBlePermissions(): Promise<PermissionResult> {
  if (Platform.OS !== 'android') return { granted: true, permanentlyDenied: false };

  const sdkInt = Platform.Version as number;

  if (sdkInt >= 31) {
    const results = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
    ]);
    const statuses = Object.values(results);
    return {
      granted: statuses.every((status) => status === PermissionsAndroid.RESULTS.GRANTED),
      permanentlyDenied: statuses.some((status) => status === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN),
    };
  }

  const status = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION, {
    title: 'Permiso de ubicación',
    message:
      'Android exige el permiso de ubicación para poder escanear dispositivos Bluetooth cercanos. ' +
      'Esta app no usa tu ubicación real ni la envía a ningún servidor.',
    buttonPositive: 'Entendido',
  });
  return {
    granted: status === PermissionsAndroid.RESULTS.GRANTED,
    permanentlyDenied: status === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN,
  };
}
