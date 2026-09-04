import { initializeApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';
import { firebaseConfig } from './firebaseConfig';

const app = initializeApp(firebaseConfig);

/**
 * React Native's networking stack doesn't support the streaming HTTP/2
 * connection Firestore's SDK prefers, so it has to fall back to long
 * polling - auto-detection sometimes picks the wrong transport on RN,
 * so this is forced explicitly (standard fix for Firestore + Hermes/RN).
 */
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});
