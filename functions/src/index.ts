import { initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret, defineString } from 'firebase-functions/params';
import { logger } from 'firebase-functions/v2';

import { sendExpoPushNotifications, sendToAllDevices } from './lib/expoPush';
import { getLatestVideos, checkIsLive } from './lib/youtube';
import { postMuslimoonForm } from './lib/muslimoonProxy';

initializeApp();

const YOUTUBE_API_KEY = defineSecret('YOUTUBE_API_KEY');
const MUSLIMOON_API_KEY = defineSecret('MUSLIMOON_API_KEY');
// Not secret — just not known at scaffold time (see CLAUDE.md open questions).
const YOUTUBE_CHANNEL_ID = defineString('YOUTUBE_CHANNEL_ID', { default: '' });

/* ------------------------------------------------------------------ */
/* 1. Push notifications for announcements                            */
/* ------------------------------------------------------------------ */
/**
 * Fires when a doc is added to `announcements`. There's no admin UI yet
 * (CLAUDE.md item 4), so for now this is written by hand in the Firebase
 * console or the CLI — the push-sending plumbing is what this unblocks.
 * Expected shape: { title: string, body: string, data?: object }
 */
export const onAnnouncementCreated = onDocumentCreated('announcements/{id}', async (event) => {
  const snap = event.data;
  if (!snap) return;
  const { title, body, data } = snap.data() as { title?: string; body?: string; data?: Record<string, unknown> };
  if (!title || !body) {
    logger.warn(`announcements/${event.params.id} is missing title or body — not sending.`);
    return;
  }
  const sentTo = await sendToAllDevices(title, body, data);
  await snap.ref.update({ sentAt: Timestamp.now(), sentTo });
  logger.log(`Announcement "${title}" pushed to ${sentTo} device(s).`);
});

/* ------------------------------------------------------------------ */
/* 2. Register a device's Expo push token                             */
/* ------------------------------------------------------------------ */
export const registerPushToken = onCall(async (request) => {
  const token = request.data?.token;
  const platform = request.data?.platform;
  if (typeof token !== 'string' || !token.startsWith('ExponentPushToken')) {
    throw new HttpsError('invalid-argument', 'A valid Expo push token is required.');
  }
  const db = getFirestore();
  const ref = db.collection('deviceTokens').doc(token);
  const existing = await ref.get();
  await ref.set(
    {
      platform: typeof platform === 'string' ? platform : 'unknown',
      updatedAt: Timestamp.now(),
      createdAt: existing.exists ? existing.data()?.createdAt : Timestamp.now(),
    },
    { merge: true },
  );
  return { ok: true };
});

/* ------------------------------------------------------------------ */
/* 3. YouTube — latest videos (cheap, callable on demand)              */
/* ------------------------------------------------------------------ */
export const getYoutubeLatest = onCall({ secrets: [YOUTUBE_API_KEY] }, async (request) => {
  const channelId = YOUTUBE_CHANNEL_ID.value();
  if (!channelId) {
    throw new HttpsError('failed-precondition', 'YOUTUBE_CHANNEL_ID is not configured yet.');
  }
  const maxResults = typeof request.data?.maxResults === 'number' ? request.data.maxResults : 10;
  const videos = await getLatestVideos(channelId, YOUTUBE_API_KEY.value(), maxResults);
  return { videos };
});

/* ------------------------------------------------------------------ */
/* 4. YouTube — live-video detector (scheduled, expensive call)        */
/* ------------------------------------------------------------------ */
/**
 * Every 15 minutes (96 calls/day * 100 units = 9,600 of the 10,000/day
 * default quota — see youtube.ts for why this can't poll more often with
 * search.list). Pushes once per broadcast, not on every tick, by tracking
 * the last-notified video id in Firestore.
 */
export const checkYoutubeLive = onSchedule(
  { schedule: 'every 15 minutes', secrets: [YOUTUBE_API_KEY] },
  async () => {
    const channelId = YOUTUBE_CHANNEL_ID.value();
    if (!channelId) {
      logger.warn('YOUTUBE_CHANNEL_ID is not configured yet — skipping live check.');
      return;
    }
    const db = getFirestore();
    const stateRef = db.doc('youtubeState/live');
    const [{ isLive, videoId, title }, stateSnap] = await Promise.all([
      checkIsLive(channelId, YOUTUBE_API_KEY.value()),
      stateRef.get(),
    ]);
    const lastNotifiedVideoId = stateSnap.data()?.lastNotifiedVideoId as string | undefined;

    if (!isLive) {
      await stateRef.set({ isLive: false, checkedAt: Timestamp.now() }, { merge: true });
      return;
    }
    if (videoId === lastNotifiedVideoId) {
      // Already pushed for this broadcast.
      await stateRef.set({ isLive: true, videoId, checkedAt: Timestamp.now() }, { merge: true });
      return;
    }

    const sentTo = await sendToAllDevices('Live now', title ?? 'A live stream just started', { kind: 'live', videoId });
    await stateRef.set(
      { isLive: true, videoId, lastNotifiedVideoId: videoId, checkedAt: Timestamp.now(), notifiedAt: Timestamp.now() },
      { merge: true },
    );
    logger.log(`Live broadcast "${title}" pushed to ${sentTo} device(s).`);
  },
);

/* ------------------------------------------------------------------ */
/* 5. Muslimoon forms proxy (auth scheme TBD — see lib/muslimoonProxy) */
/* ------------------------------------------------------------------ */
export const submitMuslimoonForm = onCall({ secrets: [MUSLIMOON_API_KEY] }, async (request) => {
  const formPath = request.data?.formPath;
  const payload = request.data?.payload;
  if (typeof formPath !== 'string' || !formPath) {
    throw new HttpsError('invalid-argument', 'formPath is required.');
  }
  const { status, body } = await postMuslimoonForm(formPath, payload ?? {}, MUSLIMOON_API_KEY.value());
  if (status >= 400) {
    throw new HttpsError('unknown', `Muslimoon returned HTTP ${status}`, body);
  }
  return body;
});

// Exported for the function's own tests / future receipt-checking job.
export { sendExpoPushNotifications };
