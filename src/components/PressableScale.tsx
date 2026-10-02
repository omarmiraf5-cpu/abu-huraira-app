import type { ReactNode } from 'react';
import {
  Platform,
  Pressable,
  type GestureResponderEvent,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { motion } from '@/src/theme/tokens';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type PressableScaleProps = Omit<PressableProps, 'style' | 'children'> & {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Scale while pressed (default 0.97). */
  scaleTo?: number;
  /** Light selection haptic on native. */
  haptic?: boolean;
};

export function triggerHaptic() {
  if (Platform.OS === 'web') return;
  Haptics.selectionAsync().catch(() => undefined);
}

/** Pressable with a soft spring scale + dim — the app's standard press feedback. */
export function PressableScale({
  children,
  style,
  scaleTo = motion.pressScale,
  haptic = true,
  onPressIn,
  onPressOut,
  onPress,
  disabled,
  accessibilityRole = 'button',
  ...rest
}: PressableScaleProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animated = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      accessibilityRole={accessibilityRole}
      accessibilityState={{ disabled: !!disabled, ...rest.accessibilityState }}
      onPressIn={(e: GestureResponderEvent) => {
        scale.value = withSpring(scaleTo, motion.spring);
        opacity.value = withTiming(0.9, { duration: 90 });
        onPressIn?.(e);
      }}
      onPressOut={(e: GestureResponderEvent) => {
        scale.value = withSpring(1, motion.spring);
        opacity.value = withTiming(1, { duration: 160 });
        onPressOut?.(e);
      }}
      onPress={(e: GestureResponderEvent) => {
        if (haptic) triggerHaptic();
        onPress?.(e);
      }}
      style={[style, animated]}
    >
      {children}
    </AnimatedPressable>
  );
}
