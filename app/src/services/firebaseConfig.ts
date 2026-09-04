/**
 * Firebase project config - NOT a secret. Firebase's client config is meant
 * to be public (it's baked into every app that uses it); the actual access
 * control lives in Firestore Security Rules (see /firestore.rules), not in
 * hiding these values.
 *
 * Replace the placeholders below with your own project's values:
 * 1. Create a free project at https://console.firebase.google.com
 * 2. Build > Firestore Database > Create database (start in production mode)
 * 3. Project settings > General > Your apps > Add app (Web) - this gives
 *    you the object below (apiKey, projectId, etc).
 * 4. Deploy /firestore.rules to that project (Firebase console > Firestore
 *    Database > Rules > paste the file's contents > Publish, or via the
 *    Firebase CLI: `firebase deploy --only firestore:rules`).
 * See README.md's "Backend (chat)" section for the full walkthrough.
 */
export const firebaseConfig = {
  apiKey: 'REPLACE_ME',
  authDomain: 'REPLACE_ME.firebaseapp.com',
  projectId: 'REPLACE_ME',
  storageBucket: 'REPLACE_ME.appspot.com',
  messagingSenderId: 'REPLACE_ME',
  appId: 'REPLACE_ME',
};
