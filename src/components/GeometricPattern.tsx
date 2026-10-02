import { useId, useMemo } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { colors } from '@/src/theme/tokens';
import { starLattice } from './geometry';

type Props = {
  width: number;
  height: number;
  tile?: number;
  color?: string;
  /** Peak stroke opacity (top of the field). */
  opacity?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * Hairline 8-point-star lattice that fades out toward the bottom edge.
 * Decorative only — hidden from screen readers.
 */
export function GeometricPattern({
  width,
  height,
  tile = 64,
  color = colors.gold,
  opacity = 0.14,
  style,
}: Props) {
  const d = useMemo(() => starLattice(width, height, tile), [width, height, tile]);
  // SVG ids are document-global on web, so each instance needs its own.
  const gradientId = `ahcFade${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, style]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Svg width={width} height={height}>
        <Defs>
          {/* userSpaceOnUse: the lattice path overshoots the view, so fade by view height */}
          <LinearGradient id={gradientId} gradientUnits="userSpaceOnUse" x1={0} y1={0} x2={0} y2={height}>
            <Stop offset="0" stopColor={color} stopOpacity={opacity} />
            <Stop offset="0.45" stopColor={color} stopOpacity={opacity * 0.55} />
            <Stop offset="0.88" stopColor={color} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Path d={d} stroke={`url(#${gradientId})`} strokeWidth={1} fill="none" />
      </Svg>
    </View>
  );
}
