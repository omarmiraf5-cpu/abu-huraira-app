import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchPrayerTimes, type PrayerTimesResult } from '@/src/api/muslimoon';
import { zonedNow } from '@/src/utils/prayerTime';
import {
  TIMEZONE,
  computeNext,
  progressToNext,
  resolvePrayer,
} from '@/src/utils/prayerSchedule';

function useMinuteTick() {
  const [tick, setTick] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setTick(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);
  return tick;
}

/**
 * Live Muslimoon prayer times (with the built-in sample fallback from
 * fetchPrayerTimes), resolved against the current Toronto wall-clock.
 */
export function usePrayerTimes() {
  const [data, setData] = useState<PrayerTimesResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fatalError, setFatalError] = useState<string | null>(null);
  const mounted = useRef(true);
  const tick = useMinuteTick();

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const load = useCallback(async (mode: 'initial' | 'refresh') => {
    if (mode === 'refresh') setRefreshing(true);
    else setLoading(true);
    try {
      const result = await fetchPrayerTimes();
      if (!mounted.current) return;
      setData(result);
      setFatalError(null);
    } catch (e) {
      if (!mounted.current) return;
      setFatalError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      if (mounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    load('initial');
  }, [load]);

  const onRefresh = useCallback(() => load('refresh'), [load]);

  const now = useMemo(() => zonedNow(TIMEZONE, new Date(tick)), [tick]);

  const daily = useMemo(
    () => (data ? data.daily.map((p) => resolvePrayer(p, now)) : []),
    [data, now],
  );
  const jummah = useMemo(
    () => (data ? data.jummah.map((p) => resolvePrayer(p, now)) : []),
    [data, now],
  );
  const extras = useMemo(
    () => (data ? data.extras.map((p) => resolvePrayer(p, now)) : []),
    [data, now],
  );
  const next = useMemo(() => computeNext(daily, jummah, now), [daily, jummah, now]);
  const progress = useMemo(() => progressToNext(daily, next, now), [daily, next, now]);

  return {
    data,
    loading,
    refreshing,
    fatalError,
    load,
    onRefresh,
    tick,
    now,
    daily,
    jummah,
    extras,
    next,
    progress,
  };
}
