/**
 * Thin client for Expo's push notification service — no expo-server-sdk
 * dependency, just the documented REST API (https://exp.host/--/api/v2/push/send).
 * Keeps this function's cold start fast and avoids tracking a second SDK's
 * version drift on top of the Expo app SDK itself.
 */
import { getFirestore } from 'firebase-admin/firestore';

const PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const CHUNK_SIZE = 100; // Expo's documented max messages per request

export type PushMessage = {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
};

type PushTicket =
  | { status: 'ok'; id: string }
  | { status: 'error'; message: string; details?: { error?: string } };

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/**
 * Send a batch of push messages. Tokens that Expo immediately reports as
 * `DeviceNotRegistered` are removed from Firestore so the token list doesn't
 * grow unbounded with dead installs.
 *
 * This only catches errors Expo returns synchronously in the ticket. A more
 * complete implementation would also fetch delivery receipts ~15+ minutes
 * later (a second scheduled function) to catch errors that only surface
 * after Apple/Google have processed the push — worth adding once there's
 * real notification volume to justify it.
 */
export async function sendExpoPushNotifications(messages: PushMessage[]): Promise<void> {
  if (messages.length === 0) return;
  const tokenByMessageIndex = messages.map((m) => m.to);
  const deadTokens: string[] = [];

  for (const batch of chunk(messages, CHUNK_SIZE)) {
    const res = await fetch(PUSH_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(batch),
    });
    if (!res.ok) {
      console.error(`Expo push request failed: HTTP ${res.status}`);
      continue;
    }
    const json = (await res.json()) as { data?: PushTicket[] };
    const tickets = json.data ?? [];
    tickets.forEach((ticket, i) => {
      if (ticket.status === 'error') {
        console.error('Expo push ticket error:', ticket.message);
        if (ticket.details?.error === 'DeviceNotRegistered') {
          deadTokens.push(tokenByMessageIndex[i]);
        }
      }
    });
  }

  if (deadTokens.length > 0) {
    const db = getFirestore();
    await Promise.all(deadTokens.map((token) => db.collection('deviceTokens').doc(token).delete()));
    console.log(`Removed ${deadTokens.length} unregistered device token(s).`);
  }
}

/** Load every registered device token and build push messages for all of them. */
export async function sendToAllDevices(title: string, body: string, data?: Record<string, unknown>): Promise<number> {
  const db = getFirestore();
  const snap = await db.collection('deviceTokens').select().get();
  const tokens = snap.docs.map((d) => d.id);
  await sendExpoPushNotifications(tokens.map((to) => ({ to, title, body, data })));
  return tokens.length;
}
