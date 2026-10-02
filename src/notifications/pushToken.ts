/**
 * Registers this device for remote push (announcements, live-stream alerts)
 * by getting an Expo push token and saving it via the `registerPushToken`
 * Cloud Function. Separate from reminders.ts/schedule.ts, which handle
 * *local* notifications (prayer/event reminders) and need no backend at all.
 *
 * Needs an EAS project id in app.json (`extra.eas.projectId`) to call
 * getExpoPushTokenAsync — that's set by `npx eas-cli@latest init`, one of
 * CLAUDE.md's open items. Until then this no-ops instead of throwing, same
 * fallback style as the rest of the notifications code.
 */
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { NOTIFICATIONS_SUPPORTED, configureNotifications, getPermission, requestPermission } from './reminders';
import { FIREBASE_CONFIGURED, callRegisterPushToken } from '@/src/config/firebase';

let registered = false;

/** Call once on launch (e.g. from a mounted effect) — safe to call repeatedly, it only does work once. */
export async function registerForPushNotificationsOnce(): Promise<void> {
  if (registered || !NOTIFICATIONS_SUPPORTED || !FIREBASE_CONFIGURED) return;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) {
    console.log('No EAS project id yet (app.json extra.eas.projectId) — skipping push token registration.');
    return;
  }

  await configureNotifications();
  let permission = await getPermission();
  if (permission === 'undetermined') permission = await requestPermission();
  if (permission !== 'granted') return;

  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    await callRegisterPushToken(token, Platform.OS);
    registered = true;
  } catch (e) {
    console.warn('Push token registration failed (will retry next launch):', e);
  }
}
