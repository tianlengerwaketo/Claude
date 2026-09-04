import type { ProximityLevel } from '../types';

/** Typical RSSI at 1 meter for a BLE advertisement, in dBm. Varies by device/antenna. */
const MEASURED_POWER_AT_1M = -59;

/** Environmental path-loss exponent (2 = free space, higher = more obstacles). */
const PATH_LOSS_EXPONENT = 2.5;

/**
 * Rough distance estimate from RSSI using the log-distance path loss model.
 * BLE RSSI is noisy (multipath, body blocking, phone orientation), so treat
 * this as a "closer/farther" hint, not a precise ranging measurement.
 */
export function rssiToDistanceMeters(rssi: number): number {
  if (rssi === 0) return -1;
  const ratio = (MEASURED_POWER_AT_1M - rssi) / (10 * PATH_LOSS_EXPONENT);
  return Math.round(Math.pow(10, ratio) * 10) / 10;
}

export function distanceToProximity(distanceMeters: number): ProximityLevel {
  if (distanceMeters < 0) return 'fuera-de-rango';
  if (distanceMeters <= 2) return 'muy-cerca';
  if (distanceMeters <= 8) return 'cerca';
  if (distanceMeters <= 20) return 'lejos';
  return 'fuera-de-rango';
}

export const PROXIMITY_LABEL: Record<ProximityLevel, string> = {
  'muy-cerca': 'Muy cerca',
  cerca: 'Cerca',
  lejos: 'Lejos',
  'fuera-de-rango': 'Señal débil',
};
