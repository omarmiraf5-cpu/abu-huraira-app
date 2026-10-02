import { useCallback, useEffect, useState } from 'react';
import { AppState, Linking, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/src/components/Screen';
import { HeroHeader } from '@/src/components/HeroHeader';
import { Card } from '@/src/components/Card';
import { Button } from '@/src/components/Button';
import { Icon, type IconName } from '@/src/components/Icon';
import { SectionHeader } from '@/src/components/SectionHeader';
import { PressableScale, triggerHaptic } from '@/src/components/PressableScale';
import { JewelIcon, type JewelTone } from '@/src/components/icons/JewelIcon';
import { FONT_CAP } from '@/src/hooks/useResponsive';
import { updatePrefs, useNotificationPrefs } from '@/src/notifications/prefs';
import {
  NOTIFICATIONS_SUPPORTED,
  getPermission,
  requestPermission,
  sendTestReminder,
  type PermissionState,
} from '@/src/notifications/reminders';
import type { NotificationPrefs, PrayerKey } from '@/src/notifications/schedule';
import { colors, radii, spacing, typography } from '@/src/theme/tokens';

const PRAYERS: { key: PrayerKey; name: string; icon: IconName; tone: JewelTone; hint: string }[] = [
  { key: 'fajr', name: 'Fajr', icon: 'fajr', tone: 'fajr', hint: 'Dawn' },
  { key: 'dhuhr', name: 'Dhuhr', icon: 'dhuhr', tone: 'dhuhr', hint: 'Midday' },
  { key: 'asr', name: 'Asr', icon: 'asr', tone: 'asr', hint: 'Afternoon' },
  { key: 'maghrib', name: 'Maghrib', icon: 'maghrib', tone: 'maghrib', hint: 'Sunset' },
  { key: 'isha', name: 'Isha', icon: 'isha', tone: 'isha', hint: 'Night' },
  { key: 'jummah', name: "Jumu'ah", icon: 'mosque', tone: 'emerald', hint: 'Fridays, at the khutbah' },
];
const LEADS = [10, 15, 20, 30];

const fmtUntil = (iso: string) =>
  new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date(iso));

export default function NotificationsScreen() {
  const { prefs, lastSync } = useNotificationPrefs();
  const [permission, setPermission] = useState<PermissionState>(NOTIFICATIONS_SUPPORTED ? 'undetermined' : 'unsupported');
  const [busy, setBusy] = useState(false);
  const [testSent, setTestSent] = useState(false);

  const refreshPermission = useCallback(() => {
    getPermission().then(setPermission).catch(() => undefined);
  }, []);

  useEffect(() => {
    refreshPermission();
    // Coming back from the Settings app
    const sub = AppState.addEventListener('change', (s) => s === 'active' && refreshPermission());
    return () => sub.remove();
  }, [refreshPermission]);

  /** Make sure we may notify before switching something on. */
  const ensurePermission = async () => {
    // Web preview: settings work (and are saved) but nothing is scheduled.
    if (permission === 'granted' || permission === 'unsupported') return true;
    const p = await requestPermission();
    setPermission(p);
    return p === 'granted';
  };

  const turnOnAll = async () => {
    setBusy(true);
    try {
      if (await ensurePermission()) {
        await updatePrefs((p) => ({ ...p, prayer: { ...p.prayer, enabled: true }, events: { ...p.events, enabled: true } }));
      }
    } finally {
      setBusy(false);
    }
  };

  const set = (change: (p: NotificationPrefs) => NotificationPrefs) => {
    triggerHaptic();
    void updatePrefs(change);
  };

  const toggle = async (change: (p: NotificationPrefs) => NotificationPrefs, turningOn: boolean) => {
    if (turningOn && !(await ensurePermission())) return;
    set(change);
  };

  const anyOn = prefs.prayer.enabled || prefs.events.enabled;
  const ready = permission === 'granted' || permission === 'unsupported';
  const prayerOn = ready && prefs.prayer.enabled;
  const eventsOn = ready && prefs.events.enabled;

  return (
    <Screen
      header={
        <HeroHeader
          top={
            <PressableScale onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} style={styles.back} accessibilityLabel="Back">
              <Icon name="chevron-back" size={18} color={colors.text} />
              <Text style={styles.backText}>Back</Text>
            </PressableScale>
          }
          eyebrow="Reminders"
          title="Notifications"
          subtitle="Salah times, classes and events from Abu Huraira Center."
        />
      }
    >
      {/* Status */}
      {permission === 'unsupported' ? (
        <Card variant="sunken" padding={spacing.md}>
          <View style={styles.statusRow}>
            <JewelIcon name="bell" tone="gold" size="md" glow={false} />
            <Text style={[styles.statusText, styles.flex]}>
              Preview: on iPhone and Android these settings schedule real reminders. In the browser, nothing is sent.
            </Text>
          </View>
        </Card>
      ) : permission === 'denied' ? (
        <Card padding={spacing.ml}>
          <View style={styles.statusRow}>
            <JewelIcon name="bell" tone="slate" size="md" glow={false} />
            <View style={styles.flex}>
              <Text style={styles.statusTitle}>Notifications are off for AHC</Text>
              <Text style={styles.statusText}>Turn them on in your phone’s Settings to get salah and event reminders.</Text>
            </View>
          </View>
          <Button label="Open Settings" variant="outline" size="md" icon="settings-outline" onPress={() => Linking.openSettings()} style={styles.statusBtn} />
        </Card>
      ) : !ready || !anyOn ? (
        <Card variant="featured" padding={spacing.ml}>
          <View style={styles.statusRow}>
            <JewelIcon name="bell" tone="gold" size="lg" />
            <View style={styles.flex}>
              <Text style={styles.heroTitle}>Never miss a salah</Text>
              <Text style={styles.statusText}>
                A gentle reminder at each adhan, and before the classes and events AHC announces.
              </Text>
            </View>
          </View>
          <Button label="Turn on reminders" icon="bell" onPress={turnOnAll} loading={busy} style={styles.statusBtn} />
        </Card>
      ) : (
        <Card padding={spacing.md}>
          <View style={styles.statusRow}>
            <View style={styles.liveDot} />
            <Text style={[styles.statusText, styles.flex]} maxFontSizeMultiplier={FONT_CAP.body}>
              {lastSync && (lastSync.prayerCount || lastSync.eventCount)
                ? `${lastSync.prayerCount} salah${lastSync.eventCount ? ` and ${lastSync.eventCount} class & event` : ''} reminders set${lastSync.until ? ` through ${fmtUntil(lastSync.until)}` : ''}.`
                : 'Reminders are on. They’ll be set as soon as the masjid’s live schedule loads.'}
            </Text>
          </View>
          <Button
            label={testSent ? 'Test reminder on its way' : 'Send a test reminder'}
            variant="ghost"
            size="sm"
            icon="paper-plane-outline"
            onPress={async () => {
              await sendTestReminder();
              setTestSent(true);
              setTimeout(() => setTestSent(false), 6000);
            }}
            style={styles.testBtn}
          />
        </Card>
      )}

      {/* Salah */}
      <SectionHeader title="Salah reminders" />
      <View style={styles.group}>
        <SwitchRow
          icon="mosque"
          tone="sapphire"
          title="Salah reminders"
          subtitle="From the masjid’s published times"
          value={prayerOn}
          onChange={(v) => toggle((p) => ({ ...p, prayer: { ...p.prayer, enabled: v } }), v)}
        />
        <View style={[styles.block, !prayerOn && styles.dim]} pointerEvents={prayerOn ? 'auto' : 'none'}>
          <Text style={styles.blockLabel}>Remind me</Text>
          <Segmented
            options={[
              { value: 'adhan', label: 'At adhan' },
              { value: 'beforeIqamah', label: 'Before iqamah' },
            ]}
            value={prefs.prayer.mode}
            onChange={(mode) => set((p) => ({ ...p, prayer: { ...p.prayer, mode: mode as NotificationPrefs['prayer']['mode'] } }))}
          />
          {prefs.prayer.mode === 'beforeIqamah' ? (
            <View style={styles.chips}>
              {LEADS.map((m) => (
                <Chip
                  key={m}
                  label={`${m} min`}
                  selected={prefs.prayer.lead === m}
                  onPress={() => set((p) => ({ ...p, prayer: { ...p.prayer, lead: m } }))}
                />
              ))}
            </View>
          ) : null}
        </View>
        {PRAYERS.map((pr) => (
          <SwitchRow
            key={pr.key}
            icon={pr.icon}
            tone={pr.tone}
            title={pr.name}
            subtitle={pr.hint}
            value={prefs.prayer.prayers[pr.key]}
            onChange={(v) => set((p) => ({ ...p, prayer: { ...p.prayer, prayers: { ...p.prayer.prayers, [pr.key]: v } } }))}
            disabled={!prayerOn}
            compact
          />
        ))}
      </View>
      <Text style={styles.note}>
        Times come from AHC’s schedule on Muslimoon and refresh each time you open the app. Maghrib follows each day’s sunset.
      </Text>

      {/* Classes & events */}
      <SectionHeader title="Classes & events" />
      <View style={styles.group}>
        <SwitchRow
          icon="calendar"
          tone="violet"
          title="Class & event reminders"
          subtitle="Everything AHC announces with a date and time"
          value={eventsOn}
          onChange={(v) => toggle((p) => ({ ...p, events: { ...p.events, enabled: v } }), v)}
        />
        <View style={[styles.block, !eventsOn && styles.dim]} pointerEvents={eventsOn ? 'auto' : 'none'}>
          <Text style={styles.blockLabel}>Remind me</Text>
          <Segmented
            options={[
              { value: '60', label: '1 hour before' },
              { value: '1440', label: 'The day before' },
            ]}
            value={String(prefs.events.lead)}
            onChange={(v) => set((p) => ({ ...p, events: { ...p.events, lead: Number(v) } }))}
          />
        </View>
      </View>
      <Text style={styles.note}>Weekly classes remind you each week. New announcements will appear here once AHC publishes them.</Text>
    </Screen>
  );
}

function SwitchRow({
  icon,
  tone,
  title,
  subtitle,
  value,
  onChange,
  disabled,
  compact,
}: {
  icon: IconName;
  tone: JewelTone;
  title: string;
  subtitle?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  compact?: boolean;
}) {
  return (
    <View style={[styles.row, disabled && styles.dim]}>
      <JewelIcon name={icon} tone={tone} size={compact ? 'xs' : 'sm'} glow={false} />
      <View style={styles.flex}>
        <Text style={[styles.rowTitle, compact && styles.rowTitleCompact]} maxFontSizeMultiplier={FONT_CAP.body}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.rowSub} maxFontSizeMultiplier={FONT_CAP.body}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ false: colors.surfacePressed, true: colors.gold }}
        thumbColor={colors.pearl}
        ios_backgroundColor={colors.surfacePressed}
        // react-native-web ignores thumbColor when on
        {...({ activeThumbColor: colors.pearl } as object)}
        accessibilityLabel={title}
      />
    </View>
  );
}

function Segmented({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={styles.segment} accessibilityRole="radiogroup">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected: on, checked: on }}
            style={[styles.segItem, on && styles.segItemOn]}
          >
            <Text style={[styles.segText, on && styles.segTextOn]} numberOfLines={1} maxFontSizeMultiplier={FONT_CAP.dense}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected, checked: selected }}
      style={[styles.chip, selected && styles.chipOn]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextOn]} maxFontSizeMultiplier={FONT_CAP.dense}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 2,
    paddingVertical: 8,
    paddingLeft: 8,
    paddingRight: 14,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  backText: { ...typography.subhead, fontFamily: typography.headline.fontFamily, color: colors.text },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  heroTitle: { ...typography.title2, color: colors.text },
  statusTitle: { ...typography.headline, color: colors.text },
  statusText: { ...typography.subhead, color: colors.textSecondary, marginTop: 2 },
  statusBtn: { marginTop: spacing.md },
  testBtn: { marginTop: spacing.sm, alignSelf: 'flex-start' },
  liveDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.success, marginHorizontal: 4 },
  group: {
    borderRadius: radii.card,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderTopColor: colors.hairlineStrong,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.ms,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.ms,
    minHeight: 60,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.hairline,
  },
  rowTitle: { ...typography.headline, color: colors.text },
  rowTitleCompact: { fontSize: 15 },
  rowSub: { ...typography.footnote, color: colors.textTertiary, marginTop: 1 },
  dim: { opacity: 0.45 },
  block: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.hairline,
    backgroundColor: 'rgba(5, 15, 25, 0.25)',
  },
  blockLabel: { ...typography.overline, color: colors.textTertiary },
  segment: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceSunken,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  segItem: { flex: 1, minWidth: 0, minHeight: 38, alignItems: 'center', justifyContent: 'center', borderRadius: radii.pill, paddingHorizontal: 8 },
  segItemOn: { backgroundColor: colors.gold },
  segText: { ...typography.subhead, fontFamily: typography.headline.fontFamily, color: colors.textSecondary },
  segTextOn: { color: colors.textOnGold },
  chips: { flexDirection: 'row', gap: spacing.sm, marginTop: 2 },
  chip: {
    flex: 1,
    minWidth: 0,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
  },
  chipOn: { borderColor: colors.gold, backgroundColor: colors.goldTint },
  chipText: { ...typography.subhead, color: colors.textSecondary },
  chipTextOn: { color: colors.gold, fontFamily: typography.headline.fontFamily },
  note: { ...typography.caption, color: colors.textTertiary, marginTop: spacing.sm, paddingHorizontal: spacing.xs },
});
