import { useState } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { NextPrayer } from '@/src/utils/prayerSchedule';
import { Badge } from '../Badge';
import { GeometricPattern } from '../GeometricPattern';
import { Icon } from '../Icon';
import { ProgressBar } from '../ProgressBar';
import { PressableScale } from '../PressableScale';
import { colors, elevation, gradients, radii, spacing, typography } from '@/src/theme/tokens';
import { prayerIcon } from './prayerIcons';

type Props = {
  next: NextPrayer;
  progress: number | null;
  source: 'live' | 'mock';
  onPress?: () => void;
};

/** The gold "next prayer" plate with countdown — used on Home and Prayer. */
export function NextPrayerHero({ next, progress, source, onPress }: Props) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (Math.abs(width - size.width) > 1 || Math.abs(height - size.height) > 1) setSize({ width, height });
  };

  const a11y = `Next prayer: ${next.name}${next.time ? `, ${next.kind ?? ''} ${next.time}` : ''}. ${next.label}.${
    source === 'mock' ? ' Sample times.' : ''
  }`;

  const body = (
    <View onLayout={onLayout}>
      <LinearGradient
        colors={gradients.gold}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, styles.radius]}
      />
      {size.width > 0 ? (
        <View style={[StyleSheet.absoluteFill, styles.radius, styles.clip]}>
          <GeometricPattern width={size.width} height={size.height} color={colors.textOnGold} opacity={0.1} tile={56} />
        </View>
      ) : null}
      <View style={styles.inner}>
        <View style={styles.topRow}>
          <View style={styles.eyebrowRow}>
            <Icon name={prayerIcon(next.key)} size={16} color={colors.textOnGold} />
            <Text style={styles.eyebrow}>{next.tomorrow ? 'Next prayer · Tomorrow' : 'Next prayer'}</Text>
          </View>
          <Badge
            label={source === 'live' ? 'Live' : 'Sample'}
            tone="onGold"
            dot={source === 'live'}
            icon={source === 'live' ? undefined : 'cloud-offline-outline'}
          />
        </View>

        <View style={styles.mainRow}>
          <Text style={styles.name} numberOfLines={1} adjustsFontSizeToFit>
            {next.name}
          </Text>
          {next.time ? (
            <View style={styles.timeCol}>
              <Text style={styles.timeLabel}>{next.kind === 'Ends' ? 'Until' : next.kind}</Text>
              <Text style={styles.time}>{next.time}</Text>
            </View>
          ) : null}
        </View>

        {progress !== null ? (
          <ProgressBar value={progress} tone="navy" height={5} style={styles.progress} accessibilityLabel="Time until next prayer" />
        ) : null}

        <View style={styles.footer}>
          <Icon name="time-outline" size={15} color={colors.textOnGold} />
          <Text style={styles.countdown}>{next.label}</Text>
        </View>
      </View>
    </View>
  );

  if (onPress) {
    return (
      <PressableScale onPress={onPress} style={styles.card} accessibilityLabel={a11y} accessibilityHint="Opens prayer times">
        {body}
      </PressableScale>
    );
  }
  return (
    <View style={styles.card} accessible accessibilityLabel={a11y}>
      {body}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.xl,
    backgroundColor: colors.gold,
    ...elevation.gold,
  },
  radius: { borderRadius: radii.xl },
  clip: { overflow: 'hidden' },
  inner: { padding: spacing.ml, paddingTop: spacing.md },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  eyebrow: { ...typography.overline, color: colors.textOnGold },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    gap: spacing.md,
  },
  name: { ...typography.display, fontSize: 40, lineHeight: 46, color: colors.textOnGold, flexShrink: 1 },
  timeCol: { alignItems: 'flex-end', paddingBottom: 4 },
  timeLabel: { ...typography.caption, color: colors.textOnGoldMuted },
  time: { ...typography.numeric, fontSize: 22, lineHeight: 28, fontFamily: typography.numericLarge.fontFamily, color: colors.textOnGold },
  progress: { marginTop: spacing.md },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.ms },
  countdown: { ...typography.headline, color: colors.textOnGold },
});
