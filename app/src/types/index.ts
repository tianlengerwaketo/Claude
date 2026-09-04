export interface UserProfile {
  name: string;
  emoji: string;
}

export type ProximityLevel = 'muy-cerca' | 'cerca' | 'lejos' | 'fuera-de-rango';

export interface NearbyPerson {
  /** BLE device id (per-scan, platform-assigned - not a stable personal identifier). */
  id: string;
  name: string;
  emoji: string;
  rssi: number;
  distanceMeters: number;
  proximity: ProximityLevel;
  /** Timestamp (ms) of the last advertisement we received from this device. */
  lastSeenAt: number;
}
