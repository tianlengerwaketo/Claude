import { BleManager } from 'react-native-ble-plx';
import BLEAdvertiser from 'react-native-ble-advertiser';
import { APP_SERVICE_UUID, COMPANY_ID } from '../constants/ble';
import { base64ToBytes } from '../utils/base64';
import { decodeProfile, encodeProfile } from '../utils/profileEncoding';
import type { UserProfile } from '../types';

/**
 * Two libraries split the work because no single actively-maintained one
 * does both roles well:
 * - react-native-ble-plx acts as the BLE "central" (scanning for others).
 * - react-native-ble-advertiser acts as the BLE "peripheral" (broadcasting
 *   ourselves), which ble-plx does not support.
 * Both filter/advertise on the same APP_SERVICE_UUID, so we only ever see
 * other instances of this app, never unrelated Bluetooth devices.
 */
const bleManager = new BleManager();

export interface ScannedPerson {
  id: string;
  rssi: number;
  name: string;
  emoji: string;
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

    // Manufacturer data starts with the 2-byte company id; our profile
    // payload (emoji index + name bytes) follows it.
    const payload = base64ToBytes(device.manufacturerData).slice(2);
    if (payload.length === 0) return;

    const { name, emoji } = decodeProfile(payload);
    onFound({ id: device.id, rssi: device.rssi, name, emoji });
  });
}

export function stopScanning(): void {
  if (!isScanning) return;
  bleManager.stopDeviceScan();
  isScanning = false;
}

export async function startAdvertising(profile: UserProfile): Promise<void> {
  if (isAdvertising) {
    await stopAdvertising();
  }

  BLEAdvertiser.setCompanyId(COMPANY_ID);
  const payload = encodeProfile(profile);

  await BLEAdvertiser.broadcast([APP_SERVICE_UUID], payload, {
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
