import { MAX_NAME_BYTES, PHONE_PAYLOAD_BYTES } from '../constants/ble';
import type { UserProfile } from '../types';

/**
 * BLE advertising payloads are tiny (Android manufacturer data is
 * realistically ~20 bytes after the company ID). Emitting an emoji as raw
 * UTF-8 could eat 4 of those bytes, so instead we send a 1-byte index into
 * this fixed palette and let the receiving app render the real emoji.
 */
export const EMOJI_PALETTE = ['🙂', '😀', '😎', '🤓', '🥳', '👋', '🐱', '🐶', '🌟', '🔥', '🎧', '📷', '⚽', '🎮', '☕', '🚀'];

/**
 * Hermes doesn't reliably ship TextEncoder/TextDecoder across RN versions,
 * so we roll minimal UTF-8 codecs by hand instead of depending on a global
 * that may or may not be polyfilled on a given device.
 */
function utf8Encode(text: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < text.length; i++) {
    let code = text.codePointAt(i)!;
    if (code > 0xffff) i++; // consumed a surrogate pair

    if (code < 0x80) {
      bytes.push(code);
    } else if (code < 0x800) {
      bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    } else if (code < 0x10000) {
      bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
    } else {
      bytes.push(
        0xf0 | (code >> 18),
        0x80 | ((code >> 12) & 0x3f),
        0x80 | ((code >> 6) & 0x3f),
        0x80 | (code & 0x3f)
      );
    }
  }
  return bytes;
}

function utf8Decode(bytes: number[]): string {
  let result = '';
  let i = 0;
  while (i < bytes.length) {
    const b0 = bytes[i];
    let code: number;
    let extraBytes: number;

    if (b0 < 0x80) {
      code = b0;
      extraBytes = 0;
    } else if ((b0 & 0xe0) === 0xc0) {
      code = b0 & 0x1f;
      extraBytes = 1;
    } else if ((b0 & 0xf0) === 0xe0) {
      code = b0 & 0x0f;
      extraBytes = 2;
    } else if ((b0 & 0xf8) === 0xf0) {
      code = b0 & 0x07;
      extraBytes = 3;
    } else {
      i++;
      continue; // skip invalid/truncated lead byte
    }

    if (i + extraBytes >= bytes.length) break; // truncated payload, stop cleanly

    for (let j = 1; j <= extraBytes; j++) {
      code = (code << 6) | (bytes[i + j] & 0x3f);
    }
    result += String.fromCodePoint(code);
    i += extraBytes + 1;
  }
  return result;
}

/**
 * Packs digits two-per-byte (BCD nibbles) so a full phone number fits in a
 * few bytes of the tiny BLE advertising payload instead of one byte per
 * digit as UTF-8 text would cost. 0xF is not a digit, so it doubles as an
 * end-of-number marker for numbers shorter than the fixed slot.
 */
function packDigits(digits: string, byteLength: number): number[] {
  const clean = digits.replace(/\D/g, '').slice(0, byteLength * 2);
  const nibbles: number[] = [];
  for (const char of clean) nibbles.push(char.charCodeAt(0) - 48);
  while (nibbles.length < byteLength * 2) nibbles.push(0xf);

  const bytes: number[] = [];
  for (let i = 0; i < nibbles.length; i += 2) {
    bytes.push((nibbles[i] << 4) | nibbles[i + 1]);
  }
  return bytes;
}

function unpackDigits(bytes: number[]): string {
  let digits = '';
  for (const byte of bytes) {
    const high = (byte >> 4) & 0xf;
    if (high === 0xf) break;
    digits += String(high);

    const low = byte & 0xf;
    if (low === 0xf) break;
    digits += String(low);
  }
  return digits;
}

export function encodeProfile(profile: UserProfile): number[] {
  const emojiIndex = Math.max(0, EMOJI_PALETTE.indexOf(profile.emoji));
  const phoneBytes = packDigits(profile.phone, PHONE_PAYLOAD_BYTES);
  const nameBytes = utf8Encode(profile.name).slice(0, MAX_NAME_BYTES);
  return [emojiIndex, ...phoneBytes, ...nameBytes];
}

export function decodeProfile(bytes: number[]): UserProfile {
  const [emojiIndex, ...rest] = bytes;
  const phoneBytes = rest.slice(0, PHONE_PAYLOAD_BYTES);
  const nameBytes = rest.slice(PHONE_PAYLOAD_BYTES);

  const emoji = EMOJI_PALETTE[emojiIndex] ?? EMOJI_PALETTE[0];
  const phone = unpackDigits(phoneBytes);
  const name = utf8Decode(nameBytes).trim();
  return { emoji, name: name || 'Alguien', phone };
}
