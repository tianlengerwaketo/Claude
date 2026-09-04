import { BleManager } from 'react-native-ble-plx';
import BLEAdvertiser from 'react-native-ble-advertiser';
import { APP_SERVICE_UUID, COMPANY_ID } from '../constants/ble';
import { base64ToBytes } from '../utils/base64';
import { bytesToHex, hexToBytes } from '../utils/token';

/**
 * Two libraries split the work because no single actively-maintained one
 * does both roles well:
 * - react-native-ble-plx acts as the BLE "central" (scanning for others).
 * - react-native-ble-advertiser acts as the BLE "peripheral" (broadcasting
 *   ourselves), which ble-plx does not support.
 * Both filter/advertise on the same APP_SERVICE_UUID, so we only ever see
 * other instances of this app, never unrelated Bluetooth devices.
 *
 * The advertisement payload is just our 8-byte device token - name, emoji
 * and everything else needed to actually reach someone lives in Firestore,
 * looked up by that token once discovered (see presenceService.ts). BLE's
 * advertising payload is only a handful of bytes, nowhere near enough for a
 * profile plus a phone number, and a raw token avoids ever having to
 * broadcast anything personal over the air in the clear.
 */
const bleManager = new BleManager();

export interface ScannedPerson {
  token: string;
  rssi: number;
}

let isScanning = false;
let isAdvertising = false;

export function startScanning(onFound: (person: ScannedPerson) => void): void {
  if (isScanning) return;
  isScanning = true;

  bleManager.startDeviceScan([APP_SERVICE_UUID], { allowDuplicates: true }, (error, device) => {
    if (error) {
      console.warn('[bleService] scan error', error);
      return;
    }
    if (!device || device.rssi == null || !device.manufacturerData) return;

    // Manufacturer data starts with the 2-byte company id; the sender's
    // device token follows it.
    const payload = base64ToBytes(device.manufacturerData).slice(2);
    if (payload.length === 0) return;

    onFound({ token: bytesToHex(payload), rssi: device.rssi });
  });
}

export function stopScanning(): void {
  if (!isScanning) return;
  bleManager.stopDeviceScan();
  isScanning = false;
}

export async function startAdvertising(myToken: string): Promise<void> {
  if (isAdvertising) {
    await stopAdvertising();
  }

  BLEAdvertiser.setCompanyId(COMPANY_ID);

  await BLEAdvertiser.broadcast([APP_SERVICE_UUID], hexToBytes(myToken), {
    advertiseMode: BLEAdvertiser.ADVERTISE_MODE_BALANCED,
    txPowerLevel: BLEAdvertiser.ADVERTISE_TX_POWER_MEDIUM,
    connectable: false,
    includeDeviceName: false,
  });
  isAdvertising = true;
}

export async function stopAdvertising(): Promise<void> {
  if (!isAdvertising) return;
  try {
    await BLEAdvertiser.stopBroadcast();
  } finally {
    isAdvertising = false;
  }
}

/** Fires immediately with the current state, then again on every change. */
export function onBluetoothStateChange(callback: (isPoweredOn: boolean) => void): () => void {
  const subscription = bleManager.onStateChange((state) => callback(state === 'PoweredOn'), true);
  return () => subscription.remove();
}

export function destroyBleManager(): void {
  stopScanning();
  bleManager.destroy();
}
