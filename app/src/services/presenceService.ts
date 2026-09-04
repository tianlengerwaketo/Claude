import { doc, getDoc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { Presence } from '../types';

/** A heartbeat older than this is treated as "actually offline" - covers an app killed without toggling off. */
const PRESENCE_STALE_MS = 3 * 60 * 1000;

function presenceDoc(token: string) {
  return doc(db, 'presence', token);
}

export async function publishPresence(token: string, profile: { name: string; emoji: string }): Promise<void> {
  await setDoc(presenceDoc(token), {
    name: profile.name,
    emoji: profile.emoji,
    isDetectable: true,
    updatedAt: serverTimestamp(),
  });
}

export async function markNotDetectable(token: string, profile: { name: string; emoji: string }): Promise<void> {
  await setDoc(presenceDoc(token), {
    name: profile.name,
    emoji: profile.emoji,
    isDetectable: false,
    updatedAt: serverTimestamp(),
  });
}

function isFresh(updatedAtMs: number): boolean {
  return Date.now() - updatedAtMs <= PRESENCE_STALE_MS;
}

/** One-time read. Returns null if the person was never seen, has never opted in, or their last heartbeat is stale. */
export async function getPresence(token: string): Promise<Presence | null> {
  const snapshot = await getDoc(presenceDoc(token));
  if (!snapshot.exists()) return null;

  const data = snapshot.data();
  const updatedAt = data.updatedAt?.toMillis?.() ?? 0;
  return {
    name: data.name ?? 'Alguien',
    emoji: data.emoji ?? '🙂',
    isDetectable: Boolean(data.isDetectable) && isFresh(updatedAt),
    updatedAt,
  };
}

/** Live subscription, e.g. to show "en línea" / "ya no disponible" in a chat header. */
export function subscribePresence(token: string, callback: (presence: Presence | null) => void): () => void {
  return onSnapshot(presenceDoc(token), (snapshot) => {
    if (!snapshot.exists()) {
      callback(null);
      return;
    }
    const data = snapshot.data();
    const updatedAt = data.updatedAt?.toMillis?.() ?? 0;
    callback({
      name: data.name ?? 'Alguien',
      emoji: data.emoji ?? '🙂',
      isDetectable: Boolean(data.isDetectable) && isFresh(updatedAt),
      updatedAt,
    });
  });
}
