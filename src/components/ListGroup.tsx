import { Children, Fragment, isValidElement, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Card } from './Card';
import { Icon, type IconName } from './Icon';
import { JewelIcon, type JewelTone } from './icons/JewelIcon';
import { triggerHaptic } from './PressableScale';
import { colors, spacing, typography } from '@/src/theme/tokens';

/** iOS-style inset grouped list on a plate, with hairline separators. */
export function ListGroup({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const items = Children.toArray(children).filter(isValidElement);
  return (
    <Card padding={0} style={style}>
      {items.map((child, i) => (
        <Fragment key={i}>
          {i > 0 ? <View style={styles.separator} /> : null}
          {child}
        </Fragment>
      ))}
    </Card>
  );
}

type RowProps = {
  title: string;
  subtitle?: string;
  value?: string;
  icon?: IconName;
  /** Jewel colour for the leading icon tile. */
  tone?: JewelTone;
  onPress?: () => void;
  /** Show a chevron (defaults to true when pressable). */
  chevron?: boolean;
  trailingIcon?: IconName;
  accessibilityHint?: string;
};

export function ListRow({
  title,
  subtitle,
  value,
  icon,
  tone = 'slate',
  onPress,
  chevron,
  trailingIcon,
  accessibilityHint,
}: RowProps) {
  const showChevron = chevron ?? !!onPress;
  const content = (
    <>
      {icon ? <JewelIcon name={icon} tone={tone} size="sm" glow={false} /> : null}
      <View style={styles.texts}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {value ? (
        <Text style={styles.value} numberOfLines={1}>
          {value}
        </Text>
      ) : null}
      {trailingIcon ? <Icon name={trailingIcon} size={16} color={colors.textTertiary} /> : null}
      {showChevron ? <Icon name="chevron-forward" size={16} color={colors.textTertiary} /> : null}
    </>
  );
  if (!onPress) return <View style={styles.row}>{content}</View>;
  return (
    <Pressable
      onPress={() => {
        triggerHaptic();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.ms,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.ms + 2,
    minHeight: 56,
  },
  pressed: { backgroundColor: colors.pearlTint },
  texts: { flex: 1 },
  title: { ...typography.headline, fontFamily: typography.callout.fontFamily, color: colors.text, fontSize: 15 },
  subtitle: { ...typography.footnote, color: colors.textTertiary, marginTop: 1 },
  value: { ...typography.subhead, color: colors.textSecondary, maxWidth: '45%' },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.hairline,
    marginLeft: spacing.md + 34 + spacing.ms,
  },
});
