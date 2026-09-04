import {
  addDoc,
  collection,
  doc,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';
import { getPresence } from './presenceService';
import type { ChatMessage, ChatMessageType } from '../types';

/** Deterministic id so both sides land on the same conversation without a lookup step. */
export function conversationIdFor(tokenA: string, tokenB: string): string {
  return [tokenA, tokenB].sort().join('_');
}

export class RecipientNotDetectableError extends Error {
  constructor() {
    super('La otra persona ya no tiene "Quiero ser detectado" activado, no le podés escribir ahora.');
  }
}

export async function sendMessage(
  conversationId: string,
  participants: [string, string],
  senderToken: string,
  text: string,
  type: ChatMessageType = 'text'
): Promise<void> {
  const recipientToken = participants.find((token) => token !== senderToken)!;

  // Enforced again server-side by firestore.rules - this client-side check
  // just gives an immediate, friendly error instead of a silent rule denial.
  const recipientPresence = await getPresence(recipientToken);
  if (!recipientPresence?.isDetectable) throw new RecipientNotDetectableError();

  await setDoc(doc(db, 'conversations', conversationId), { participants }, { merge: true });
  await addDoc(collection(db, 'conversations', conversationId, 'messages'), {
    senderToken,
    type,
    text,
    createdAt: serverTimestamp(),
  });
}

export function subscribeMessages(conversationId: string, callback: (messages: ChatMessage[]) => void): () => void {
  const messagesQuery = query(collection(db, 'conversations', conversationId, 'messages'), orderBy('createdAt', 'asc'));

  return onSnapshot(messagesQuery, (snapshot) => {
    const messages = snapshot.docs.map((docSnapshot) => {
      const data = docSnapshot.data();
      return {
        id: docSnapshot.id,
        senderToken: data.senderToken,
        type: data.type ?? 'text',
        text: data.text ?? '',
        createdAt: data.createdAt?.toMillis?.() ?? Date.now(),
      } satisfies ChatMessage;
    });
    callback(messages);
  });
}
