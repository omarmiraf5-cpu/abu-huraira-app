import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PressableScale } from './PressableScale';
import { colors, elevation, gradients, radii, spacing } from '@/src/theme/tokens';

export type CardVariant = 'plate' | 'featured' | 'gold' | 'tint' | 'outline' | 'sunken';

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: CardVariant;
  /** Inner padding (defaults to 20). */
  padding?: number;
  radius?: number;
  onPress?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
};

/**
 * A "plate": the app's core surface. Opaque navy with a hairline edge and a
 * soft layered shadow; `featured` and `gold` variants add a gradient wash.
 */
export function Card({
  children,
  style,
  variant = 'plate',
  padding = spacing.ml,
  radius = radii.card,
  onPress,
  accessibilityLabel,
  accessibilityHint,
}: Props) {
  const base: StyleProp<ViewStyle> = [
    styles.base,
    variantStyles[variant],
    { borderRadius: radius },
    style,
  ];

  const gradient =
    variant === 'gold' ? gradients.gold : variant === 'featured' ? gradients.plate : null;

  const inner = (
    <>
      {gradient ? (
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: radius }]}
        />
      ) : null}
      <View style={{ padding }}>{children}</View>
    </>
  );

  if (onPress) {
    return (
      <PressableScale
        onPress={onPress}
        style={base}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
      >
        {inner}
      </PressableScale>
    );
  }
  return (
    <View style={base} accessibilityLabel={accessibilityLabel}>
      {inner}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'visible',
  },
});

const variantStyles = StyleSheet.create({
  plate: {
    backgroundColor: colors.surface,
    borderColor: colors.hairline,
    ...elevation.sm,
  },
  featured: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.hairlineStrong,
    ...elevation.md,
  },
  gold: {
    backgroundColor: colors.gold,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    ...elevation.gold,
  },
  tint: {
    backgroundColor: colors.goldTint,
    borderColor: colors.goldHairline,
  },
  outline: {
    backgroundColor: 'transparent',
    borderColor: colors.hairlineStrong,
  },
  sunken: {
    backgroundColor: colors.surfaceSunken,
    borderColor: colors.hairline,
  },
});
