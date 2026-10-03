import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/src/components/Screen';
import { HeroHeader } from '@/src/components/HeroHeader';
import { BrandLogo } from '@/src/components/BrandLogo';
import { Card } from '@/src/components/Card';
import { Button } from '@/src/components/Button';
import { Badge } from '@/src/components/Badge';
import { SectionHeader } from '@/src/components/SectionHeader';
import { ProgressBar } from '@/src/components/ProgressBar';
import { PressableScale } from '@/src/components/PressableScale';
import { EmptyState } from '@/src/components/EmptyState';
import { EventCard } from '@/src/components/EventCard';
import { AnnouncementCard } from '@/src/components/AnnouncementCard';
import { WatchLiveCard } from '@/src/components/WatchLiveCard';
import { Icon, type IconName } from '@/src/components/Icon';
import { NextPrayerHero } from '@/src/components/prayer/NextPrayerHero';
import { prayerIcon, prayerTone } from '@/src/components/prayer/prayerIcons';
import { JewelIcon, JEWELS, type JewelTone } from '@/src/components/icons/JewelIcon';
import { usePrayerTimes } from '@/src/hooks/usePrayerTimes';
import { FONT_CAP } from '@/src/hooks/useResponsive';
import { useNotificationPrefs } from '@/src/notifications/prefs';
import {
  fetchAnnouncementsResult,
  fetchCampaigns,
  fetchEventsResult,
  type Announcement,
  type Campaign,
  type EventItem,
} from '@/src/api/muslimoon';
import { TIMEZONE } from '@/src/utils/prayerSchedule';
import { brand, colors, layout, locale, radii, spacing, typography } from '@/src/theme/tokens';

function greetingFor(minutes: number) {
  if (minutes < 12 * 60) return 'Good morning';
  if (minutes < 17 * 60) return 'Good afternoon';
  return 'Good evening';
}

const money = (n: number) =>
  new Intl.NumberFormat(locale.language, {
    style: 'currency',
    currency: locale.currency,
    maximumFractionDigits: 0,
  }).format(n);

const QUICK_ACTIONS: { label: string; icon: IconName; tone: JewelTone; onPress: () => void; hint: string }[] = [
  { label: 'Prayer', icon: 'mosque', tone: 'sapphire', onPress: () => router.push('/(tabs)/prayer'), hint: 'Opens prayer times' },
  { label: 'Events', icon: 'calendar', tone: 'violet', onPress: () => router.push('/(tabs)/events'), hint: 'Opens events' },
  { label: 'Donate', icon: 'give', tone: 'rose', onPress: () => router.push('/(tabs)/donate'), hint: 'Opens donations' },
  { label: 'Website', icon: 'globe', tone: 'emerald', onPress: () => Linking.openURL(brand.website), hint: 'Opens abuhuraira.org' },
];

export default function HomeScreen() {
  const prayer = usePrayerTimes();
  const notif = useNotificationPrefs();
  const remindersOn = notif.prefs.prayer.enabled || notif.prefs.events.enabled;
  const [events, setEvents] = useState<EventItem[] | null>(null);
  const [eventsSample, setEventsSample] = useState(false);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [announcementsSample, setAnnouncementsSample] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchEventsResult()
      .then((r) => {
        if (!alive) return;
        setEvents(r.items);
        setEventsSample(r.source === 'sample');
      })
      .catch(() => alive && setEvents([]));
    fetchCampaigns()
      .then((list) => alive && setCampaign(list.find((c) => c.id === 'dollar-a-day') ?? list[0] ?? null))
      .catch(() => undefined);
    fetchAnnouncementsResult()
      .then((r) => {
        if (!alive) return;
        setAnnouncements(r.items);
        setAnnouncementsSample(r.source === 'sample');
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  const todayLabel = useMemo(
    () =>
      new Intl.DateTimeFormat(locale.language, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        timeZone: TIMEZONE,
      }).format(new Date(prayer.tick)),
    [prayer.tick],
  );

  const goal = campaign?.goal ?? 0;
  const raised = campaign?.raised ?? 0;

  return (
    <Screen
      refreshing={prayer.refreshing}
      onRefresh={prayer.onRefresh}
      header={
        <HeroHeader
          top={
            <View style={styles.topBar}>
              <View style={styles.brandRow}>
                <BrandLogo height={40} />
                <View>
                  <Text style={styles.brandName}>{brand.name}</Text>
                  <Text style={styles.brandSub}>Toronto · Masjid & Community</Text>
                </View>
              </View>
              <PressableScale
                onPress={() => router.push('/notifications')}
                style={styles.bell}
                accessibilityLabel="Notifications"
                accessibilityHint="Opens salah and event reminder settings"
              >
                <Icon name="bell" size={21} color={colors.text} accent={colors.gold} filled={remindersOn} />
                {!remindersOn ? <View style={styles.bellDot} /> : null}
              </PressableScale>
            </View>
          }
        >
          <Text style={styles.date}>{todayLabel}</Text>
          <Text style={styles.arabic} accessibilityLanguage="ar">
            السَّلَامُ عَلَيْكُمْ
          </Text>
          <Text style={styles.greeting} accessibilityRole="header">
            Assalamu alaikum
          </Text>
          <Text style={styles.subGreeting}>
            {greetingFor(prayer.now.minutes)} — here’s your day at AHC.
          </Text>
        </HeroHeader>
      }
    >
      {/* Next prayer hero */}
      {prayer.next && prayer.data ? (
        <NextPrayerHero
          next={prayer.next}
          progress={prayer.progress}
          source={prayer.data.source}
          onPress={() => router.push('/(tabs)/prayer')}
        />
      ) : (
        <Card padding={spacing.xl}>
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.gold} />
            <Text style={styles.loadingText}>Loading today’s prayer times…</Text>
          </View>
        </Card>
      )}

      {/* Today strip */}
      {prayer.daily.length > 0 ? (
        <Card padding={spacing.sm} style={styles.stripCard}>
          <View style={styles.strip}>
            {prayer.daily.map((p) => {
              const active = prayer.next?.key === p.key;
              const shown = p.adhanApprox ?? p.adhan ?? p.iqamah ?? '—';
              return (
                <View
                  key={p.key}
                  style={[styles.stripItem, active && styles.stripItemActive]}
                  accessible
                  accessibilityLabel={`${p.name} ${shown}${active ? ', next' : ''}`}
                >
                  {active ? (
                    <JewelIcon name={prayerIcon(p.key)} tone={prayerTone(p.key)} size={30} />
                  ) : (
                    <View style={styles.stripGlyph}>
                      <Icon name={prayerIcon(p.key)} size={20} color={JEWELS[prayerTone(p.key)].stops[0]} accent={JEWELS[prayerTone(p.key)].stops[0]} />
                    </View>
                  )}
                  <Text
                    style={[styles.stripName, active && { color: colors.gold }]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    maxFontSizeMultiplier={FONT_CAP.dense}
                  >
                    {p.name}
                  </Text>
                  <Text
                    style={[styles.stripTime, active && { color: colors.text }]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    maxFontSizeMultiplier={FONT_CAP.dense}
                  >
                    {shown.replace(/\s?(AM|PM)$/i, '')}
                  </Text>
                </View>
              );
            })}
          </View>
        </Card>
      ) : null}

      {/* Reminders prompt */}
      {notif.loaded && !remindersOn ? (
        <PressableScale
          onPress={() => router.push('/notifications')}
          style={styles.remind}
          accessibilityLabel="Turn on salah reminders"
          accessibilityHint="Opens notification settings"
        >
          <JewelIcon name="bell" tone="gold" size="md" />
          <View style={styles.remindText}>
            <Text style={styles.remindTitle} maxFontSizeMultiplier={FONT_CAP.body}>Salah reminders</Text>
            <Text style={styles.remindBody} maxFontSizeMultiplier={FONT_CAP.body}>
              Get notified at each adhan, and before classes and events.
            </Text>
          </View>
          <View style={styles.remindPill}>
            <Text style={styles.remindPillText} maxFontSizeMultiplier={FONT_CAP.dense}>Turn on</Text>
          </View>
        </PressableScale>
      ) : null}

      {/* Quick actions */}
      <SectionHeader title="Quick actions" />
      <View style={styles.actions}>
        {QUICK_ACTIONS.map((a) => (
          <PressableScale
            key={a.label}
            onPress={a.onPress}
            style={styles.action}
            accessibilityLabel={a.label}
            accessibilityHint={a.hint}
          >
            <JewelIcon name={a.icon} tone={a.tone} size="lg" />
            <Text style={styles.actionLabel} numberOfLines={1} adjustsFontSizeToFit maxFontSizeMultiplier={FONT_CAP.dense}>
              {a.label}
            </Text>
          </PressableScale>
        ))}
      </View>

      {/* Announcements — Muslimoon announcement-bar (website preview when empty) */}
      {announcements.length > 0 ? (
        <>
          <SectionHeader title="Announcements" eyebrow={announcementsSample ? 'Preview' : undefined} />
          <View style={styles.announcements}>
            {announcements.slice(0, 3).map((a) => (
              <AnnouncementCard key={a.id} item={a} />
            ))}
          </View>
        </>
      ) : null}

      {/* Upcoming events */}
      <SectionHeader
        title="Upcoming at AHC"
        eyebrow={eventsSample ? 'Preview' : undefined}
        actionLabel="See all"
        onAction={() => router.push('/(tabs)/events')}
      />
      {events === null ? (
        <Card padding={spacing.lg}>
          <ActivityIndicator color={colors.gold} />
        </Card>
      ) : events.length === 0 ? (
        <EmptyState
          icon="calendar-outline"
          title="No events yet"
          body="New programs and gatherings will appear here as soon as they’re announced."
        />
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.carousel}
          contentContainerStyle={styles.carouselContent}
          decelerationRate="fast"
          snapToInterval={232 + spacing.ms}
          snapToAlignment="start"
        >
          {events.map((e) => (
            <EventCard key={e.id} event={e} variant="compact" onPress={() => router.push({ pathname: '/event/[id]', params: { id: e.id } })} />
          ))}
        </ScrollView>
      )}

      {/* Watch live (YouTube) */}
      <View style={styles.watch}>
        <WatchLiveCard />
      </View>

      {/* Donate CTA */}
      <SectionHeader title="Support your masjid" />
      <Card variant="featured" padding={spacing.ml}>
        <View style={styles.donateTop}>
          <JewelIcon name="give" tone="gold" size="lg" />
          <View style={styles.donateTitles}>
            <Text style={styles.donateTitle}>{campaign?.name ?? 'Dollar a Day'}</Text>
            <Text style={styles.donateBody}>
              {campaign?.description ?? 'Sustain the masjid with a daily gift.'}
            </Text>
          </View>
        </View>
        {goal > 0 ? (
          <View style={styles.donateProgress}>
            <ProgressBar value={raised / goal} height={8} accessibilityLabel={`${money(raised)} raised of ${money(goal)}`} />
            <View style={styles.donateNumbers}>
              <Text style={styles.donateRaised}>
                {money(raised)} <Text style={styles.donateOf}>raised</Text>
              </Text>
              <Text style={styles.donateOf}>Goal {money(goal)}</Text>
            </View>
          </View>
        ) : null}
        <Button
          label="Give now"
          icon="heart"
          onPress={() => router.push('/(tabs)/donate')}
          style={styles.donateBtn}
        />
      </Card>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerRule} />
        <Text style={styles.footerText}>{brand.tagline}</Text>
        <Badge label={prayer.data?.source === 'live' ? 'Prayer times live from Muslimoon' : 'Showing sample data'} tone="neutral" style={styles.footerBadge} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  remind: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.ms,
    marginTop: spacing.ms,
    padding: spacing.md,
    borderRadius: radii.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.goldHairline,
  },
  remindText: { flex: 1, minWidth: 0 },
  remindTitle: { ...typography.headline, color: colors.text },
  remindBody: { ...typography.footnote, color: colors.textSecondary, marginTop: 1 },
  remindPill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radii.pill, backgroundColor: colors.gold },
  remindPillText: { ...typography.caption, fontFamily: typography.headline.fontFamily, color: colors.textOnGold },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.ms, flexShrink: 1 },
  bell: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  bellDot: {
    position: 'absolute',
    top: 10,
    right: 11,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gold,
    borderWidth: 1.5,
    borderColor: '#173c5b',
  },
  brandName: { ...typography.headline, color: colors.text },
  brandSub: { ...typography.caption, color: colors.textTertiary, marginTop: 1 },
  date: { ...typography.overline, color: colors.nur },
  arabic: {
    fontFamily: 'Amiri_400Regular',
    fontSize: 22,
    lineHeight: 34,
    color: colors.gold,
    marginTop: spacing.ms,
    writingDirection: 'rtl',
    alignSelf: 'flex-start',
  },
  greeting: { ...typography.largeTitle, color: colors.text, marginTop: spacing.xxs },
  subGreeting: { ...typography.callout, color: colors.textSecondary, marginTop: spacing.xs },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.ms, justifyContent: 'center' },
  loadingText: { ...typography.subhead, color: colors.textSecondary },
  stripCard: { marginTop: spacing.ms },
  strip: { flexDirection: 'row', justifyContent: 'space-between' },
  stripItem: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 2,
    alignItems: 'center',
    paddingVertical: spacing.ms,
    borderRadius: radii.lg,
    gap: 5,
  },
  stripGlyph: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  stripItemActive: {
    backgroundColor: colors.accentFillStrong,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.goldHairline,
  },
  stripName: { ...typography.caption, color: colors.textSecondary },
  stripTime: { ...typography.numeric, fontSize: 14, lineHeight: 18, color: colors.textSecondary },
  actions: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.ms },
  action: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 4,
    alignItems: 'center',
    paddingTop: spacing.ml,
    paddingBottom: spacing.md,
    borderRadius: radii.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderTopColor: colors.hairlineStrong,
    gap: spacing.ms,
    boxShadow: '0px 1px 2px rgba(0,0,0,0.2), 0px 8px 20px rgba(0,0,0,0.18)',
  },
  actionLabel: { ...typography.caption, fontSize: 12.5, color: colors.text, letterSpacing: 0.1 },
  carousel: { marginHorizontal: -layout.gutter, overflow: 'visible' },
  announcements: { gap: spacing.ms },
  watch: { marginTop: spacing.md },
  carouselContent: { paddingHorizontal: layout.gutter, gap: spacing.ms, paddingBottom: spacing.sm },
  donateTop: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  donateTitles: { flex: 1 },
  donateTitle: { ...typography.title2, color: colors.text },
  donateBody: { ...typography.subhead, color: colors.textSecondary, marginTop: 2 },
  donateProgress: { marginTop: spacing.ml },
  donateNumbers: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  donateRaised: { ...typography.numeric, fontSize: 15, color: colors.gold },
  donateOf: { ...typography.footnote, fontFamily: typography.footnote.fontFamily, color: colors.textTertiary },
  donateBtn: { marginTop: spacing.ml },
  footer: { alignItems: 'center', marginTop: spacing.xxl, gap: spacing.ms },
  footerRule: { width: 40, height: 2, borderRadius: 1, backgroundColor: colors.goldHairline },
  footerText: { ...typography.footnote, color: colors.textTertiary, textAlign: 'center' },
  footerBadge: { alignSelf: 'center' },
});
