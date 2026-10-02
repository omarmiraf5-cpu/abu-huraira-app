import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { fetchEventsResult, fetchPrayerTimes } from '@/src/api/muslimoon';
import { useNotificationPrefs } from './prefs';
import { NOTIFICATIONS_SUPPORTED, configureNotifications, syncReminders } from './reminders';

const MIN_INTERVAL_MS = 10 * 60_000;

/**
 * Invisible: keeps reminders current. Re-plans on launch, when the app comes
 * back to the foreground (at most every 10 minutes), and whenever the
 * settings change. Tapping a reminder opens the matching tab.
 */
export function ReminderSync() {
  const { prefs, loaded } = useNotificationPrefs();
  const last = useRef(0);
  const running = useRef(false);
  const prefsKey = JSON.stringify(prefs);

  useEffect(() => {
    if (!NOTIFICATIONS_SUPPORTED) return;
    void configureNotifications();
    const sub = Notifications.addNotificationResponseReceivedListener((res) => {
      const kind = (res.notification.request.content.data as { kind?: string } | undefined)?.kind;
      router.push(kind === 'event' || kind === 'class' ? '/(tabs)/events' : '/(tabs)/prayer');
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!NOTIFICATIONS_SUPPORTED || !loaded) return;
    const run = async (force: boolean) => {
      if (running.current || (!force && Date.now() - last.current < MIN_INTERVAL_MS)) return;
      running.current = true;
      try {
        const needPrayer = prefs.prayer.enabled;
        const needEvents = prefs.events.enabled;
        const [prayer, events] = await Promise.all([
          needPrayer ? fetchPrayerTimes() : Promise.resolve(null),
          needEvents ? fetchEventsResult() : Promise.resolve(null),
        ]);
        await syncReminders({ prefs, prayer, events });
        last.current = Date.now();
      } catch {
        // Keep whatever is already scheduled; try again next time.
      } finally {
        running.current = false;
      }
    };
    void run(true); // settings changed (or first load)
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') void run(false);
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, prefsKey]);

  return null;
}
