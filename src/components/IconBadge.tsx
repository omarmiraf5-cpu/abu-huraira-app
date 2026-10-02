import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Icon, type IconName } from './Icon';
import { JewelIcon, type JewelTone } from './icons/JewelIcon';
import { colors, radii } from '@/src/theme/tokens';

type Props = {
  name: IconName;
  size?: 'sm' | 'md' | 'lg';
  tone?: 'gold' | 'neutral' | 'onGold' | 'solid';
  /** Render as a glossy gradient jewel tile instead. */
  jewel?: JewelTone;
  glow?: boolean;
  style?: StyleProp<ViewStyle>;
};

const DIM = { sm: 32, md: 40, lg: 52 } as const;
const GLYPH = { sm: 16, md: 20, lg: 24 } as const;
const RADIUS = { sm: radii.sm, md: radii.md - 2, lg: radii.lg } as const;

/** Icon set in a soft rounded-square tile. */
export function IconBadge({ name, size = 'md', tone = 'gold', jewel, glow, style }: Props) {
  if (jewel) return <JewelIcon name={name} tone={jewel} size={size} glow={glow} style={style} />;
  const palette = {
    gold: { bg: colors.accentFill, border: colors.goldHairline, fg: colors.gold },
    neutral: { bg: colors.pearlTint, border: colors.hairline, fg: colors.text },
    onGold: { bg: 'rgba(9, 30, 48, 0.1)', border: 'rgba(9, 30, 48, 0.12)', fg: colors.textOnGold },
    solid: { bg: colors.gold, border: colors.gold, fg: colors.textOnGold },
  }[tone];
  return (
    <View
      style={[
        styles.tile,
        {
          width: DIM[size],
          height: DIM[size],
          borderRadius: RADIUS[size],
          backgroundColor: palette.bg,
          borderColor: palette.border,
        },
        style,
      ]}
    >
      <Icon name={name} size={GLYPH[size]} color={palette.fg} />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
});
