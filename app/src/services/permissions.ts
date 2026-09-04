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
export async function requestBlePermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;

  const sdkInt = Platform.Version as number;

  if (sdkInt >= 31) {
    const results = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
    ]);
    return Object.values(results).every((status) => status === PermissionsAndroid.RESULTS.GRANTED);
  }

  const status = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION, {
    title: 'Permiso de ubicación',
    message:
      'Android exige el permiso de ubicación para poder escanear dispositivos Bluetooth cercanos. ' +
      'Esta app no usa tu ubicación real ni la envía a ningún servidor.',
    buttonPositive: 'Entendido',
  });
  return status === PermissionsAndroid.RESULTS.GRANTED;
}
