import { useState, type ReactNode } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GeometricPattern } from './GeometricPattern';
import { colors, gradients, layout, spacing, typography } from '@/src/theme/tokens';

type Props = {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  /** Element shown at the top-right (e.g. a badge or logo). */
  right?: ReactNode;
  /** Element shown at the top-left instead of nothing (e.g. logo). */
  top?: ReactNode;
  children?: ReactNode;
  pattern?: boolean;
};

/**
 * Full-bleed gradient header that runs under the status bar, with an optional
 * hairline star lattice. Its gradient ends transparent, so it melts into the
 * screen background without a seam.
 */
export function HeroHeader({ eyebrow, title, subtitle, right, top, children, pattern = true }: Props) {
  const insets = useSafeAreaInsets();
  const [size, setSize] = useState({ width: 0, height: 0 });
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (Math.abs(width - size.width) > 1 || Math.abs(height - size.height) > 1) {
      setSize({ width, height });
    }
  };

  return (
    <View style={styles.root} onLayout={onLayout}>
      {/* The wash extends below the header and eases out, so there is no seam. */}
      <View pointerEvents="none" style={styles.washArea}>
        <LinearGradient
          colors={gradients.heroWash}
          locations={HERO_WASH_STOPS}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {/* soft light from the top-right corner */}
        <LinearGradient
          colors={gradients.heroGlow}
          start={{ x: 1, y: 0 }}
          end={{ x: 0.35, y: 0.6 }}
          style={StyleSheet.absoluteFill}
        />
      </View>
      {pattern && size.width > 0 ? (
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.clip]}>
          <GeometricPattern width={size.width} height={size.height} />
        </View>
      ) : null}
      <View style={[styles.inner, { paddingTop: insets.top + spacing.ms }]}>
        {top || right ? (
          <View style={styles.topRow}>
            <View style={styles.topLeft}>{top}</View>
            {right}
          </View>
        ) : null}
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        {title ? (
          <Text style={styles.title} accessibilityRole="header">
            {title}
          </Text>
        ) : null}
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        {children}
      </View>
    </View>
  );
}

const HERO_WASH_STOPS = [0, 0.22, 0.42, 0.6, 0.76, 0.9, 1] as const;

const styles = StyleSheet.create({
  root: { zIndex: 0 },
  washArea: { position: 'absolute', top: 0, left: 0, right: 0, bottom: -160 },
  clip: { overflow: 'hidden' },
  inner: {
    paddingHorizontal: layout.gutter,
    paddingBottom: spacing.lg,
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    minHeight: 36,
  },
  topLeft: { flex: 1 },
  eyebrow: {
    ...typography.overline,
    color: colors.nur,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.largeTitle,
    color: colors.text,
  },
  subtitle: {
    ...typography.callout,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});
