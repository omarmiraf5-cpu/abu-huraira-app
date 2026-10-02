import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PressableScale } from './PressableScale';
import { Icon, type IconName } from './Icon';
import { colors, elevation, gradients, radii, spacing, typography } from '@/src/theme/tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
export type ButtonSize = 'lg' | 'md' | 'sm';

export type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  trailingIcon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  accessibilityHint?: string;
};

const HEIGHT: Record<ButtonSize, number> = { lg: 56, md: 48, sm: 38 };
const PAD: Record<ButtonSize, number> = { lg: spacing.lg, md: spacing.ml, sm: spacing.md };

/** Pill button — brand "pill" shape with four tones. */
export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'lg',
  icon,
  trailingIcon,
  disabled,
  loading,
  fullWidth = true,
  style,
  textStyle,
  accessibilityHint,
}: ButtonProps) {
  const isDisabled = !!(disabled || loading);
  const fg =
    variant === 'primary'
      ? colors.textOnGold
      : variant === 'secondary'
        ? colors.text
        : colors.gold;
  const fontSize = size === 'sm' ? 14 : size === 'md' ? 15 : 16;
  const iconSize = size === 'sm' ? 16 : 18;

  const content = loading ? (
    <ActivityIndicator color={fg} />
  ) : (
    <View style={styles.row}>
      {icon ? <Icon name={icon} size={iconSize} color={fg} /> : null}
      <Text
        style={[typography.button, { color: fg, fontSize }, textStyle]}
        numberOfLines={1}
      >
        {label}
      </Text>
      {trailingIcon ? <Icon name={trailingIcon} size={iconSize} color={fg} /> : null}
    </View>
  );

  return (
    <PressableScale
      onPress={onPress}
      disabled={isDisabled}
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: !!loading }}
      style={[
        styles.base,
        { minHeight: HEIGHT[size], paddingHorizontal: PAD[size] },
        fullWidth ? styles.full : styles.auto,
        variantStyles[variant],
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {variant === 'primary' ? (
        <LinearGradient
          colors={gradients.gold}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, styles.gradient]}
        />
      ) : null}
      {content}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  gradient: { borderRadius: radii.pill },
  full: { alignSelf: 'stretch' },
  auto: { alignSelf: 'flex-start' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  disabled: { opacity: 0.45 },
});

const variantStyles = StyleSheet.create({
  primary: {
    backgroundColor: colors.gold,
    ...elevation.gold,
  },
  secondary: {
    backgroundColor: colors.surfaceRaised,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairlineStrong,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.goldHairline,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
});
