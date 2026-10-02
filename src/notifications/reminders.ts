/**
 * Native side of reminders: permissions, Android channels, and turning the
 * plan from schedule.ts into scheduled local notifications.
 *
 * Local notifications work in Expo Go and in builds, on iOS and Android.
 * They are not available on web — every function here is a safe no-op there.
 */
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import type { EventItem, ListResult, PrayerTimesResult } from '@/src/api/muslimoon';
import {
  planEventReminders,
  planPrayerReminders,
  type NotificationPrefs,
  type PlannedReminder,
} from './schedule';
import { setLastSync, type SyncSummary } from './prefs';

export const NOTIFICATIONS_SUPPORTED = Platform.OS === 'ios' || Platform.OS === 'android';

let configured = false;

/** Call once at startup: foreground presentation + Android channels. */
export async function configureNotifications() {
  if (!NOTIFICATIONS_SUPPORTED || configured) return;
  configured = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('prayer', {
      name: 'Salah reminders',
      description: 'Adhan and iqamah reminders for Abu Huraira Center',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [0, 250, 150, 250],
      lightColor: '#ffbb50',
    });
    await Notifications.setNotificationChannelAsync('events', {
      name: 'Classes & events',
      description: 'Reminders before classes and events you follow',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
      lightColor: '#ffbb50',
    });
  }
}

export type PermissionState = 'granted' | 'denied' | 'undetermined' | 'unsupported';

export async function getPermission(): Promise<PermissionState> {
  if (!NOTIFICATIONS_SUPPORTED) return 'unsupported';
  const p = await Notifications.getPermissionsAsync();
  if (p.granted || p.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) return 'granted';
  return p.status === 'denied' ? 'denied' : 'undetermined';
}

/** Ask the OS for permission (shows the system prompt the first time only). */
export async function requestPermission(): Promise<PermissionState> {
  if (!NOTIFICATIONS_SUPPORTED) return 'unsupported';
  await configureNotifications(); // Android 13+ only prompts once a channel exists
  const p = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowSound: true, allowBadge: false },
  });
  return p.granted ? 'granted' : p.status === 'denied' ? 'denied' : 'undetermined';
}

async function schedule(r: PlannedReminder) {
  await Notifications.scheduleNotificationAsync({
    identifier: r.id,
    content: {
      title: r.title,
      body: r.body,
      sound: 'default',
      data: { ...r.data, ahc: true },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: r.at,
      channelId: r.channel,
    },
  });
}

/**
 * Re-plan and reschedule. Each category is only replaced when fresh LIVE data
 * is available, so a failed fetch never wipes reminders that are already set;
 * a category that has been switched off is cleared.
 */
export async function syncReminders(input: {
  prefs: NotificationPrefs;
  prayer?: PrayerTimesResult | null;
  events?: ListResult<EventItem> | null;
  now?: Date;
}): Promise<SyncSummary | null> {
  if (!NOTIFICATIONS_SUPPORTED) return null;
  if ((await getPermission()) !== 'granted') return null;
  const now = input.now ?? new Date();
  const pending = await Notifications.getAllScheduledNotificationsAsync();
  const ours = (prefix: string) => pending.filter((n) => n.identifier.startsWith(prefix));

  const replacePrayer = !input.prefs.prayer.enabled || input.prayer?.source === 'live';
  const replaceEvents = !input.prefs.events.enabled || input.events?.source === 'live';

  if (replacePrayer) {
    await Promise.all(ours('prayer:').map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)));
    for (const r of planPrayerReminders(input.prayer, input.prefs, now)) await schedule(r);
  }
  if (replaceEvents) {
    await Promise.all(ours('event:').map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)));
    for (const r of planEventReminders(input.events, input.prefs, now)) await schedule(r);
  }

  const after = (await Notifications.getAllScheduledNotificationsAsync()).map((n) => n.identifier);
  // Identifiers carry their own dates ("prayer:2026-10-07:isha", "event:<id>:<ISO start>"),
  // which is steadier than reading triggers back (their shape differs by platform).
  const latest = after
    .map((id) => {
      if (id.startsWith('prayer:')) return Date.parse(`${id.split(':')[1]}T23:59:00`);
      if (id.startsWith('event:')) return Date.parse(id.slice(-24)); // toISOString() is always 24 chars
      return NaN;
    })
    .filter((v) => Number.isFinite(v));
  const summary: SyncSummary = {
    prayerCount: after.filter((id) => id.startsWith('prayer:')).length,
    eventCount: after.filter((id) => id.startsWith('event:')).length,
    until: latest.length ? new Date(Math.max(...latest)).toISOString() : null,
    at: now.toISOString(),
  };
  setLastSync(summary);
  return summary;
}

/** A sample reminder in 5 seconds, so people can see what they'll get. */
export async function sendTestReminder() {
  if (!NOTIFICATIONS_SUPPORTED) return;
  await configureNotifications();
  await Notifications.scheduleNotificationAsync({
    identifier: `test:${Date.now()}`,
    content: {
      title: 'Asr · 5:00 PM',
      body: 'This is how salah reminders from Abu Huraira Center will look.',
      sound: 'default',
      data: { kind: 'prayer', ahc: true },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 5, channelId: 'prayer' },
  });
}

/** Clears every AHC reminder (used when the user turns everything off). */
export async function cancelAllReminders() {
  if (!NOTIFICATIONS_SUPPORTED) return;
  const pending = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    pending
      .filter((n) => /^(prayer|event|test):/.test(n.identifier))
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
  setLastSync(null);
}
