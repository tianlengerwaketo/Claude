export interface UserProfile {
  name: string;
  emoji: string;
  /** Digits only (no "+", spaces or dashes), full international format - e.g. "5491112345678". */
  phone: string;
}

export type ProximityLevel = 'muy-cerca' | 'cerca' | 'lejos' | 'fuera-de-rango';

export interface DetectedPerson {
  /** BLE device id (per-scan, platform-assigned - not a stable personal identifier). */
  id: string;
  name: string;
  emoji: string;
  phone: string;
  rssi: number;
  distanceMeters: number;
  proximity: ProximityLevel;
  /** Timestamp (ms) this person was first ever detected. */
  firstDetectedAt: number;
  /** Timestamp (ms) of the most recent advertisement we received from this device. */
  detectedAt: number;
}
