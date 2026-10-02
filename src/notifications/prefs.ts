/**
 * Notification preferences — saved on the device (AsyncStorage) and shared
 * across screens through a tiny external store.
 */
import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_PREFS, type NotificationPrefs } from './schedule';

const KEY = 'ahc.notifications.v1';

export type SyncSummary = {
  prayerCount: number;
  eventCount: number;
  /** ISO time of the last scheduled reminder */
  until: string | null;
  /** ISO time of this sync */
  at: string;
};

type State = { prefs: NotificationPrefs; loaded: boolean; lastSync: SyncSummary | null };

let state: State = { prefs: DEFAULT_PREFS, loaded: false, lastSync: null };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function merge(saved: Partial<NotificationPrefs> | null): NotificationPrefs {
  if (!saved) return DEFAULT_PREFS;
  return {
    prayer: {
      ...DEFAULT_PREFS.prayer,
      ...saved.prayer,
      prayers: { ...DEFAULT_PREFS.prayer.prayers, ...saved.prayer?.prayers },
    },
    events: { ...DEFAULT_PREFS.events, ...saved.events },
  };
}

let loading: Promise<void> | null = null;
export function loadPrefs(): Promise<void> {
  if (!loading) {
    loading = (async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY);
        state = { ...state, prefs: merge(raw ? JSON.parse(raw) : null), loaded: true };
      } catch {
        state = { ...state, loaded: true };
      }
      emit();
    })();
  }
  return loading;
}

export function getPrefs(): NotificationPrefs {
  return state.prefs;
}

export async function updatePrefs(change: (p: NotificationPrefs) => NotificationPrefs): Promise<NotificationPrefs> {
  const next = change(state.prefs);
  state = { ...state, prefs: next };
  emit();
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Storage is best-effort; the in-memory value still applies this session.
  }
  return next;
}

export function setLastSync(summary: SyncSummary | null) {
  state = { ...state, lastSync: summary };
  emit();
}

function subscribe(l: () => void) {
  listeners.add(l);
  if (!state.loaded) void loadPrefs();
  return () => listeners.delete(l);
}

/** Live notification preferences + last sync summary. */
export function useNotificationPrefs() {
  return useSyncExternalStore(subscribe, () => state, () => state);
}
