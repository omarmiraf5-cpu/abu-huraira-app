import { useCallback, useEffect, useState } from 'react';
import { router } from 'expo-router';
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

  // Dated events first (featured = the soonest), then classes & programs.
  const dated = events.filter((e) => e.kind !== 'class');
  const classes = events.filter((e) => e.kind === 'class');
  const featured = dated[0] ?? classes[0];
  const rest = dated.filter((e) => e !== featured);
  const programs = classes.filter((e) => e !== featured);
  const open = (e: EventItem) => router.push({ pathname: '/event/[id]', params: { id: e.id } });

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
                  <Text style={styles.noticeStrong}>Preview from abuhuraira.org. </Text>
                  AHC hasn’t published classes or events in the app yet. These come from the website to show how they’ll appear; check details before attending.
                </Text>
              </View>
            </Card>
          ) : null}

          {featured ? <EventCard event={featured} variant="featured" onPress={() => open(featured)} /> : null}

          {rest.length > 0 ? (
            <>
              <SectionHeader title={sample ? 'This week at AHC' : 'More events'} eyebrow={`${rest.length} upcoming`} />
              <View style={styles.list}>
                {rest.map((event) => (
                  <EventCard key={event.id} event={event} variant="row" onPress={() => open(event)} />
                ))}
              </View>
            </>
          ) : null}

          {programs.length > 0 ? (
            <>
              <SectionHeader title="Classes & programs" eyebrow={`${programs.length} ${programs.length === 1 ? 'program' : 'programs'}`} />
              <View style={styles.list}>
                {programs.map((event) => (
                  <EventCard key={event.id} event={event} variant="row" onPress={() => open(event)} />
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
