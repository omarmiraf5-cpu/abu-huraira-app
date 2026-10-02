import { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/src/components/Screen';
import { HeroHeader } from '@/src/components/HeroHeader';
import { Card } from '@/src/components/Card';
import { Badge } from '@/src/components/Badge';
import { Button } from '@/src/components/Button';
import { Icon } from '@/src/components/Icon';
import { IconBadge } from '@/src/components/IconBadge';
import { SectionHeader } from '@/src/components/SectionHeader';
import { StarMedallion } from '@/src/components/StarMedallion';
import { NextPrayerHero } from '@/src/components/prayer/NextPrayerHero';
import { prayerIcon, prayerTone } from '@/src/components/prayer/prayerIcons';
import { JewelIcon } from '@/src/components/icons/JewelIcon';
import { FONT_CAP, useResponsive } from '@/src/hooks/useResponsive';
import { usePrayerTimes } from '@/src/hooks/usePrayerTimes';
import {
  TIMEZONE,
  formatCalendarDate,
  type ResolvedPrayer,
} from '@/src/utils/prayerSchedule';
import { colors, locale, radii, spacing, typography } from '@/src/theme/tokens';

export default function PrayerScreen() {
  const { data, loading, refreshing, fatalError, load, onRefresh, tick, daily, jummah, extras, next, progress } =
    usePrayerTimes();

  const todayLabel = new Intl.DateTimeFormat(locale.language, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: TIMEZONE,
  }).format(new Date(tick));

  const updatedLabel = useMemo(() => {
    // last_updated has no UTC offset (e.g. "2026-10-01T00:00:00.2"), so only the
    // calendar date is shown rather than guessing the timezone of the clock part.
    const date = data?.lastUpdated?.slice(0, 10);
    return date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? formatCalendarDate(date) : null;
  }, [data?.lastUpdated]);

  const statusBadge = data ? (
    data.source === 'live' ? (
      <Badge label="Live" tone="success" dot />
    ) : (
      <Badge label="Sample times" tone="warning" icon="cloud-offline-outline" />
    )
  ) : null;

  return (
    <Screen
      refreshing={refreshing}
      onRefresh={onRefresh}
      header={
        <HeroHeader
          eyebrow={todayLabel}
          title="Prayer Times"
          subtitle="Abu Huraira Center · Toronto"
          right={statusBadge}
        />
      }
    >
      {loading && !data ? (
        <Card padding={spacing.xxl}>
          <View style={styles.center}>
            <ActivityIndicator color={colors.gold} size="large" />
            <Text style={styles.loadingText}>Loading prayer times…</Text>
          </View>
        </Card>
      ) : fatalError && !data ? (
        <Card padding={spacing.xl}>
          <View style={styles.center}>
            <StarMedallion icon="alert-circle-outline" size={76} />
            <Text style={styles.errorTitle}>Couldn’t load prayer times</Text>
            <Text style={styles.errorBody}>{fatalError}</Text>
            <Button label="Try again" variant="outline" size="md" icon="refresh" fullWidth={false} onPress={() => load('initial')} style={styles.retry} />
          </View>
        </Card>
      ) : data ? (
        <>
          {data.source === 'mock' ? (
            <Card variant="sunken" padding={spacing.md} style={styles.notice}>
              <View style={styles.noticeRow}>
                <Icon name="cloud-offline-outline" size={18} color={colors.warning} />
                <View style={styles.noticeText}>
                  <Text style={styles.noticeTitle}>Showing sample times</Text>
                  <Text style={styles.noticeBody}>
                    We couldn’t reach the masjid schedule{data.error ? ` (${data.error})` : ''}. Pull down to retry.
                  </Text>
                </View>
              </View>
            </Card>
          ) : null}

          {next ? <NextPrayerHero next={next} progress={progress} source={data.source} /> : null}

          <SectionHeader title="Today" eyebrow="Daily prayers" />
          <PrayerTable rows={daily} nextKey={next?.key} />

          {jummah.length > 0 ? (
            <>
              <SectionHeader
                title="Jumu’ah"
                eyebrow={data.nextFriday ? `Friday · ${formatCalendarDate(data.nextFriday)}` : 'Friday prayer'}
              />
              <PrayerTable
                rows={jummah}
                nextKey={next?.key}
                adhanLabel="Khutbah"
                subtitleFor={(p) => (p.khateeb ? `Khateeb: ${p.khateeb}` : undefined)}
              />
            </>
          ) : null}

          {extras.length > 0 ? (
            <>
              <SectionHeader title="Special prayers" />
              <PrayerTable rows={extras} />
            </>
          ) : null}

          {data.janazah?.available ? (
            <>
              <SectionHeader title="Janazah" />
              <Card>
                <View style={styles.janazahRow}>
                  <IconBadge name="crescent" jewel="isha" />
                  <View style={styles.flex}>
                    <Text style={styles.janazahTitle}>
                      {[data.janazah.date, data.janazah.time].filter(Boolean).join(' · ') || 'Janazah prayer'}
                    </Text>
                    {data.janazah.salah_location ? (
                      <Text style={styles.janazahBody}>{data.janazah.salah_location}</Text>
                    ) : null}
                  </View>
                </View>
              </Card>
            </>
          ) : null}

          <View style={styles.footer}>
            {daily.some((p) => p.adhanApprox) ? (
              <Text style={styles.footnote}>≈ Sunset is estimated for the AHC location.</Text>
            ) : null}
            <Text style={styles.footnote}>
              Times shown in Toronto time ({TIMEZONE}).
              {data.source === 'live' && updatedLabel ? ` Updated ${updatedLabel}.` : ''}
            </Text>
          </View>
        </>
      ) : null}
    </Screen>
  );
}

function PrayerTable({
  rows,
  nextKey,
  adhanLabel = 'Adhan',
  subtitleFor,
}: {
  rows: ResolvedPrayer[];
  nextKey?: string;
  adhanLabel?: string;
  subtitleFor?: (p: ResolvedPrayer) => string | undefined;
}) {
  const { compact } = useResponsive();
  const col = { width: compact ? TIME_COL_COMPACT : TIME_COL };
  return (
    <Card padding={0}>
      <View style={[styles.tableHead, compact && styles.compactPad]}>
        <Text style={[styles.headCell, styles.flex]} maxFontSizeMultiplier={FONT_CAP.dense}>Prayer</Text>
        <Text style={[styles.headCell, styles.timeColHead, col]} maxFontSizeMultiplier={FONT_CAP.dense}>{adhanLabel}</Text>
        <Text style={[styles.headCell, styles.timeColHead, col]} maxFontSizeMultiplier={FONT_CAP.dense}>Iqamah</Text>
      </View>
      {rows.map((p, i) => (
        <PrayerRow
          key={p.key}
          prayer={p}
          highlighted={nextKey === p.key}
          first={i === 0}
          adhanLabel={adhanLabel}
          subtitle={subtitleFor?.(p)}
        />
      ))}
    </Card>
  );
}

function PrayerRow({
  prayer,
  highlighted,
  first,
  adhanLabel,
  subtitle,
}: {
  prayer: ResolvedPrayer;
  highlighted: boolean;
  first: boolean;
  adhanLabel: string;
  subtitle?: string;
}) {
  const a11y = [
    prayer.name,
    highlighted ? 'next prayer' : null,
    prayer.adhan ? `${adhanLabel} ${prayer.adhan}${prayer.adhanApprox ? `, about ${prayer.adhanApprox.replace('≈ ', '')}` : ''}` : null,
    prayer.iqamah ? `Iqamah ${prayer.iqamah}${prayer.iqamahApprox ? `, about ${prayer.iqamahApprox.replace('≈ ', '')}` : ''}` : null,
    subtitle,
  ]
    .filter(Boolean)
    .join(', ');

  const { compact } = useResponsive();
  return (
    <View
      style={[styles.row, compact && styles.compactPad, !first && styles.rowDivider, highlighted && styles.rowActive]}
      accessible
      accessibilityLabel={a11y}
    >
      {highlighted ? <View style={styles.activeBar} /> : null}
      <View style={[styles.flex, styles.nameCell, compact && styles.nameCellCompact]}>
        <JewelIcon name={prayerIcon(prayer.key)} tone={prayerTone(prayer.key)} size={compact ? 32 : 38} glow={highlighted} />
        <View style={styles.flex}>
          <View style={styles.nameLine}>
            <Text
              style={[styles.name, compact && styles.nameCompact, highlighted && styles.nameActive]}
              numberOfLines={1}
              maxFontSizeMultiplier={FONT_CAP.dense}
            >
              {prayer.name}
            </Text>
            {highlighted ? <Badge label="Next" tone="solidGold" style={styles.nextBadge} /> : null}
          </View>
          {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      <TimeCell value={prayer.adhan} approx={prayer.adhanApprox} strong={highlighted} compact={compact} />
      <TimeCell value={prayer.iqamah} approx={prayer.iqamahApprox} strong={highlighted} compact={compact} />
    </View>
  );
}

function TimeCell({
  value,
  approx,
  strong,
  compact,
}: {
  value: string | null;
  approx?: string;
  strong?: boolean;
  compact?: boolean;
}) {
  return (
    <View style={[styles.timeCol, compact && { width: TIME_COL_COMPACT }]}>
      <Text
        style={[styles.time, compact && styles.timeCompact, strong && styles.timeStrong, !value && styles.timeEmpty]}
        numberOfLines={1}
        adjustsFontSizeToFit
        maxFontSizeMultiplier={FONT_CAP.dense}
      >
        {value ?? '—'}
      </Text>
      {approx ? (
        <Text style={styles.approx} numberOfLines={1} adjustsFontSizeToFit maxFontSizeMultiplier={FONT_CAP.dense}>
          {approx}
        </Text>
      ) : null}
    </View>
  );
}

const TIME_COL = 86;
const TIME_COL_COMPACT = 68;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { alignItems: 'center', gap: spacing.ms },
  loadingText: { ...typography.subhead, color: colors.textSecondary },
  errorTitle: { ...typography.title3, color: colors.text, marginTop: spacing.xs },
  errorBody: { ...typography.subhead, color: colors.textSecondary, textAlign: 'center' },
  retry: { marginTop: spacing.sm, alignSelf: 'center' },
  notice: { marginBottom: spacing.md, borderColor: 'rgba(251, 191, 36, 0.25)' },
  noticeRow: { flexDirection: 'row', gap: spacing.ms, alignItems: 'flex-start' },
  noticeText: { flex: 1 },
  noticeTitle: { ...typography.subhead, fontFamily: typography.headline.fontFamily, color: colors.text },
  noticeBody: { ...typography.footnote, color: colors.textSecondary, marginTop: 2 },
  tableHead: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  headCell: { ...typography.overline, fontSize: 10, color: colors.textTertiary },
  timeColHead: { width: TIME_COL, textAlign: 'right' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.ms + 2,
    minHeight: 64,
  },
  rowDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.hairline },
  rowActive: { backgroundColor: colors.accentFillStrong },
  activeBar: {
    position: 'absolute',
    left: 0,
    top: 10,
    bottom: 10,
    width: 3,
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
    backgroundColor: colors.gold,
  },
  nameCell: { flexDirection: 'row', alignItems: 'center', gap: spacing.ms, minWidth: 0 },
  nameCellCompact: { gap: spacing.sm },
  compactPad: { paddingHorizontal: spacing.ms },
  nameCompact: { fontSize: 15 },
  timeCompact: { fontSize: 13.5 },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: radii.sm,
    backgroundColor: colors.accentFill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.goldHairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIconActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  nameLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  name: { ...typography.headline, color: colors.text },
  nameActive: { color: colors.gold },
  nextBadge: { paddingVertical: 2, paddingHorizontal: 7 },
  rowSubtitle: { ...typography.caption, color: colors.textTertiary, marginTop: 2 },
  timeCol: { width: TIME_COL, alignItems: 'flex-end' },
  time: { ...typography.numeric, fontSize: 15, color: colors.textSecondary, textAlign: 'right' },
  timeStrong: { color: colors.text, fontFamily: typography.numericLarge.fontFamily },
  timeEmpty: { color: colors.textTertiary },
  approx: { ...typography.caption, color: colors.nur, textAlign: 'right', marginTop: 1 },
  janazahRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  janazahTitle: { ...typography.headline, color: colors.text },
  janazahBody: { ...typography.subhead, color: colors.textSecondary, marginTop: 2 },
  footer: { marginTop: spacing.xl, gap: spacing.xs, alignItems: 'center' },
  footnote: { ...typography.footnote, color: colors.textTertiary, textAlign: 'center' },
});
