import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/src/components/Screen';
import { HeroHeader } from '@/src/components/HeroHeader';
import { Card } from '@/src/components/Card';
import { Badge } from '@/src/components/Badge';
import { Icon } from '@/src/components/Icon';
import { SectionHeader } from '@/src/components/SectionHeader';
import { EmptyState } from '@/src/components/EmptyState';
import { EventCard } from '@/src/components/EventCard';
import { fetchEventsResult, type EventItem } from '@/src/api/muslimoon';
import { colors, spacing, typography } from '@/src/theme/tokens';

export default function EventsScreen() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [sample, setSample] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadedOnce, setLoadedOnce] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchEventsResult();
      setEvents(data.items);
      setSample(data.source === 'sample');
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
      setLoadedOnce(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const [featured, ...rest] = events;

  return (
    <Screen
      refreshing={loading && loadedOnce}
      onRefresh={load}
      header={
        <HeroHeader
          eyebrow="Community"
          title="Events"
          subtitle="Programs and gatherings at Abu Huraira Center."
          right={sample && events.length > 0 ? <Badge label="Preview" tone="gold" icon="sparkles-outline" /> : undefined}
        />
      }
    >
      {!loadedOnce ? (
        <Card padding={spacing.xxl}>
          <View style={styles.center}>
            <ActivityIndicator color={colors.gold} size="large" />
            <Text style={styles.muted}>Loading events…</Text>
          </View>
        </Card>
      ) : events.length === 0 ? (
        <EmptyState
          icon="calendar-outline"
          title="No upcoming events"
          body="New programs, classes, and community gatherings will appear here as soon as they’re announced."
          actionLabel="Refresh"
          onAction={load}
        />
      ) : (
        <>
          {sample ? (
            <Card variant="sunken" padding={spacing.md} style={styles.notice}>
              <View style={styles.noticeRow}>
                <Icon name="information-circle-outline" size={18} color={colors.nur} />
                <Text style={styles.noticeText}>
                  <Text style={styles.noticeStrong}>Preview schedule. </Text>
                  AHC hasn’t published events yet — these samples show how they’ll appear.
                </Text>
              </View>
            </Card>
          ) : null}

          {featured ? <EventCard event={featured} variant="featured" /> : null}

          {rest.length > 0 ? (
            <>
              <SectionHeader title="More events" eyebrow={`${rest.length} upcoming`} />
              <View style={styles.list}>
                {rest.map((event) => (
                  <EventCard key={event.id} event={event} variant="row" />
                ))}
              </View>
            </>
          ) : null}

          {Platform.OS !== 'web' ? <Text style={styles.footnote}>Pull down to refresh.</Text> : null}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', gap: spacing.ms },
  muted: { ...typography.subhead, color: colors.textSecondary },
  notice: { marginBottom: spacing.md },
  noticeRow: { flexDirection: 'row', gap: spacing.ms, alignItems: 'flex-start' },
  noticeText: { ...typography.footnote, color: colors.textSecondary, flex: 1 },
  noticeStrong: { fontFamily: typography.headline.fontFamily, color: colors.text },
  list: { gap: spacing.ms },
  footnote: { ...typography.footnote, color: colors.textTertiary, textAlign: 'center', marginTop: spacing.xl },
});
