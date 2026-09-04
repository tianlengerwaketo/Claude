/**
 * Every install gets a random 8-byte "device token" instead of a real
 * account. It's the only thing broadcast over BLE (see bleService.ts) and
 * doubles as the document id for that install's presence/chat data in
 * Firestore - unguessable enough (2^64 possibilities) that knowing it is
 * effectively how Firestore Security Rules gate access to it, without
 * needing real authentication for what is, on purpose, an anonymous app.
 */
const TOKEN_BYTE_LENGTH = 8;

export function generateDeviceToken(): string {
  const bytes: number[] = [];
  for (let i = 0; i < TOKEN_BYTE_LENGTH; i++) bytes.push(Math.floor(Math.random() * 256));
  return bytesToHex(bytes);
}

export function bytesToHex(bytes: number[]): string {
  return bytes.map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function hexToBytes(hex: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < hex.length; i += 2) bytes.push(parseInt(hex.slice(i, i + 2), 16));
  return bytes;
}
