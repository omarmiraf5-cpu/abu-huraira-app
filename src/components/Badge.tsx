import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Icon, type IconName } from './Icon';
import { colors, radii, spacing, typography } from '@/src/theme/tokens';

export type BadgeTone = 'gold' | 'success' | 'warning' | 'neutral' | 'onGold' | 'solidGold';

type Props = {
  label: string;
  tone?: BadgeTone;
  icon?: IconName;
  /** Small status dot before the label. */
  dot?: boolean;
  style?: StyleProp<ViewStyle>;
};

const TONES: Record<BadgeTone, { bg: string; fg: string; border: string }> = {
  gold: { bg: colors.goldTint, fg: colors.gold, border: colors.goldHairline },
  success: { bg: colors.successTint, fg: colors.success, border: 'rgba(74, 222, 128, 0.3)' },
  warning: { bg: colors.warningTint, fg: colors.warning, border: 'rgba(251, 191, 36, 0.3)' },
  neutral: { bg: colors.pearlTint, fg: colors.textSecondary, border: colors.hairline },
  onGold: { bg: 'rgba(9, 30, 48, 0.1)', fg: colors.textOnGold, border: 'rgba(9, 30, 48, 0.16)' },
  solidGold: { bg: colors.gold, fg: colors.textOnGold, border: colors.gold },
};

export function Badge({ label, tone = 'gold', icon, dot, style }: Props) {
  const t = TONES[tone];
  return (
    <View style={[styles.badge, { backgroundColor: t.bg, borderColor: t.border }, style]}>
      {dot ? <View style={[styles.dot, { backgroundColor: t.fg }]} /> : null}
      {icon ? <Icon name={icon} size={12} color={t.fg} /> : null}
      <Text style={[styles.label, { color: t.fg }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  label: { ...typography.caption, fontFamily: typography.overline.fontFamily, letterSpacing: 0.2 },
});
