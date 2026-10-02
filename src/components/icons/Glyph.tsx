import { memo } from 'react';
import type { ColorValue, StyleProp, ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { GLYPHS, type GlyphName } from './glyphs';

type Props = {
  name: GlyphName;
  size?: number;
  /** Line + solid colour. */
  color?: ColorValue;
  /** Duotone fill colour (defaults to `color`). */
  accent?: ColorValue;
  /** Active/filled state: the duotone layer goes near-opaque. */
  filled?: boolean;
  /** Override the duotone opacity directly. */
  toneOpacity?: number;
  strokeWidth?: number;
  style?: StyleProp<ViewStyle>;
};

/** Renders one glyph from the AHC custom icon set. */
export const Glyph = memo(function Glyph({
  name,
  size = 22,
  color = '#f5f0e8',
  accent,
  filled = false,
  toneOpacity,
  strokeWidth = 1.75,
  style,
}: Props) {
  const parts = GLYPHS[name];
  const fill = (accent ?? color) as string;
  const stroke = color as string;
  const opacity = toneOpacity ?? (filled ? 0.95 : 0.26);
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={style}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {parts.map((p, i) =>
        p.kind === 'line' ? (
          <Path
            key={i}
            d={p.d}
            fill="none"
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : p.kind === 'tone' ? (
          <Path key={i} d={p.d} fill={fill} fillOpacity={opacity} />
        ) : (
          <Path key={i} d={p.d} fill={stroke} />
        ),
      )}
    </Svg>
  );
});
