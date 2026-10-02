/**
 * Firebase client init — Cloud Functions only.
 *
 * The app never talks to Firestore directly (see firestore.rules: every
 * collection denies client access by design) — everything goes through a
 * callable function, which validates input and uses the Admin SDK on the
 * backend. So the client only needs `firebase/app` + `firebase/functions`,
 * not the Firestore SDK and its React Native persistence setup.
 *
 * These EXPO_PUBLIC_FIREBASE_* values are not secrets — Firebase's own docs
 * are explicit that the web config is safe to ship in a client bundle;
 * access control lives in firestore.rules and in what each callable
 * function chooses to do, not in hiding these ids.
 */
import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { getFunctions, httpsCallable } from 'firebase/functions';

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

export const FIREBASE_CONFIGURED = Boolean(firebaseConfig.projectId && firebaseConfig.apiKey);

function app() {
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

function functions() {
  return getFunctions(app());
}

export type RegisterPushTokenResult = { ok: true };
export async function callRegisterPushToken(token: string, platform: string) {
  const fn = httpsCallable<{ token: string; platform: string }, RegisterPushTokenResult>(
    functions(),
    'registerPushToken',
  );
  return (await fn({ token, platform })).data;
}

export type YoutubeVideo = { id: string; title: string; publishedAt: string; thumbnailUrl?: string };
export async function callGetYoutubeLatest(maxResults = 10) {
  const fn = httpsCallable<{ maxResults: number }, { videos: YoutubeVideo[] }>(functions(), 'getYoutubeLatest');
  return (await fn({ maxResults })).data.videos;
}

export async function callSubmitMuslimoonForm(formPath: string, payload: unknown) {
  const fn = httpsCallable<{ formPath: string; payload: unknown }, unknown>(functions(), 'submitMuslimoonForm');
  return (await fn({ formPath, payload })).data;
}
