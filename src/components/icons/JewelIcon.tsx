import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon, type IconName } from '../Icon';

/**
 * Curated gradient palettes for icon tiles. Chosen to sit comfortably on the
 * AHC navy: saturated but deep, each with a lighter top stop for a lit look.
 * The prayer tones follow the colour of the sky at each salah.
 *
 * Contrast: every white-glyph tone's middle stop holds ≥ 3:1 against white
 * (WCAG non-text contrast for icons); gold and dhuhr use a dark glyph instead.
 */
export const JEWELS = {
  gold: { stops: ['#ffd37f', '#ffb547', '#f08a17'], glyph: '#0a2236', glow: 'rgba(244, 148, 27, 0.45)' },
  emerald: { stops: ['#34d399', '#059669', '#065f46'], glyph: '#ffffff', glow: 'rgba(16, 185, 129, 0.4)' },
  sapphire: { stops: ['#7dd3fc', '#3b82f6', '#1e40af'], glyph: '#ffffff', glow: 'rgba(59, 130, 246, 0.42)' },
  rose: { stops: ['#fda4af', '#f43f5e', '#be123c'], glyph: '#ffffff', glow: 'rgba(244, 63, 94, 0.4)' },
  violet: { stops: ['#c4b5fd', '#8b5cf6', '#5b21b6'], glyph: '#ffffff', glow: 'rgba(139, 92, 246, 0.42)' },
  teal: { stops: ['#22d3ee', '#0891b2', '#155e75'], glyph: '#ffffff', glow: 'rgba(6, 182, 212, 0.4)' },
  slate: { stops: ['#5b7593', '#2f4a68', '#1b3048'], glyph: '#f5f0e8', glow: 'rgba(0, 0, 0, 0.35)' },
  /* Sky at each prayer */
  fajr: { stops: ['#e9a8f5', '#a855f7', '#5b21b6'], glyph: '#ffffff', glow: 'rgba(192, 132, 252, 0.42)' },
  dhuhr: { stops: ['#fef08a', '#fbbf24', '#ea8a0c'], glyph: '#3b2402', glow: 'rgba(251, 191, 36, 0.45)' },
  asr: { stops: ['#fdba74', '#ea580c', '#9a3412'], glyph: '#ffffff', glow: 'rgba(251, 146, 60, 0.42)' },
  maghrib: { stops: ['#fca5a5', '#dc4a2c', '#9d174d'], glyph: '#ffffff', glow: 'rgba(236, 72, 153, 0.4)' },
  isha: { stops: ['#a5b4fc', '#4f46e5', '#1e1b4b'], glyph: '#ffffff', glow: 'rgba(79, 70, 229, 0.45)' },
} as const;

export type JewelTone = keyof typeof JEWELS;

const SIZES = { xs: 28, sm: 34, md: 42, lg: 56, xl: 64 } as const;
export type JewelSize = keyof typeof SIZES;

type Props = {
  name: IconName;
  tone?: JewelTone;
  size?: JewelSize | number;
  /** Turn off the coloured glow (e.g. inside dense lists). */
  glow?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * A glossy "jewel" icon tile — gradient body, specular top highlight, inner
 * rim and a soft coloured glow. The app's signature icon treatment.
 */
export function JewelIcon({ name, tone = 'gold', size = 'md', glow = true, style }: Props) {
  const dim = typeof size === 'number' ? size : SIZES[size];
  const radius = Math.round(dim * 0.3);
  const j = JEWELS[tone];
  const glyph = Math.round(dim * 0.52);
  return (
    <View
      style={[
        { width: dim, height: dim, borderRadius: radius },
        glow && { boxShadow: `0px ${Math.round(dim / 8)}px ${Math.round(dim / 2.6)}px ${j.glow}` },
        style,
      ]}
    >
      <LinearGradient
        colors={j.stops}
        locations={[0, 0.45, 1]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: radius }]}
      />
      {/* Specular highlight across the upper half */}
      <LinearGradient
        colors={['rgba(255,255,255,0.42)', 'rgba(255,255,255,0.08)', 'rgba(255,255,255,0)']}
        locations={[0, 0.45, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.62 }}
        style={[StyleSheet.absoluteFill, { borderRadius: radius }]}
      />
      {/* Inner rim */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: radius,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.28)',
            borderBottomColor: 'rgba(0,0,0,0.12)',
          },
        ]}
      />
      <View style={[StyleSheet.absoluteFill, styles.center]}>
        <Icon name={name} size={glyph} color={j.glyph} accent={j.glyph} filled={false} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
});
