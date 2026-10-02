import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { PressableScale } from './PressableScale';
import { Icon } from './Icon';
import { colors, spacing, typography } from '@/src/theme/tokens';

type Props = {
  title: string;
  eyebrow?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
};

export function SectionHeader({ title, eyebrow, actionLabel, onAction, style }: Props) {
  return (
    <View style={[styles.row, style]}>
      <View style={styles.titles}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>
      </View>
      {actionLabel && onAction ? (
        <PressableScale
          onPress={onAction}
          hitSlop={10}
          style={styles.action}
          accessibilityLabel={`${actionLabel}: ${title}`}
        >
          <Text style={styles.actionText}>{actionLabel}</Text>
          <Icon name="chevron-forward" size={14} color={colors.gold} />
        </PressableScale>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    marginBottom: spacing.ms,
  },
  titles: { flexShrink: 1 },
  eyebrow: { ...typography.overline, color: colors.textTertiary, marginBottom: spacing.xxs },
  title: { ...typography.title3, color: colors.text },
  action: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingVertical: 2 },
  actionText: { ...typography.subhead, fontFamily: typography.headline.fontFamily, color: colors.gold },
});
