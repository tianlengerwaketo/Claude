export interface UserProfile {
  name: string;
  emoji: string;
  /** Optional - only used if the user chooses to share it inside a chat. Digits only. */
  phone: string;
}

export type ProximityLevel = 'muy-cerca' | 'cerca' | 'lejos' | 'fuera-de-rango';

export interface DetectedPerson {
  /** The other device's broadcast token - a stable identity across sessions, unlike a raw BLE scan id. */
  token: string;
  name: string;
  emoji: string;
  rssi: number;
  distanceMeters: number;
  proximity: ProximityLevel;
  /** Timestamp (ms) this person was first ever detected. */
  firstDetectedAt: number;
  /** Timestamp (ms) of the most recent advertisement we received from this device. */
  detectedAt: number;
  /**
   * Timestamp (ms) since this person's "quiero ser detectado" was last seen
   * off, or null while they're currently on (or we haven't checked yet).
   * Once this has been non-null for OFFLINE_REMOVE_AFTER_MS, they're pruned
   * from the list automatically - see useDetectedPeoplePruning.ts.
   */
  remoteOfflineSince: number | null;
}

/** Firestore doc at presence/{token} - the public, anonymous "profile card" behind a token. */
export interface Presence {
  name: string;
  emoji: string;
  isDetectable: boolean;
  /** Server timestamp (ms since epoch) of the last heartbeat/toggle - used to detect a stale "on" left behind by a killed app. */
  updatedAt: number;
}

export type ChatMessageType = 'text' | 'phone_share';

/** Firestore doc at conversations/{conversationId}/messages/{messageId}. */
export interface ChatMessage {
  id: string;
  senderToken: string;
  type: ChatMessageType;
  text: string;
  /** Server timestamp (ms since epoch). */
  createdAt: number;
}
