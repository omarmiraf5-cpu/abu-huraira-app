import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, radii } from '@/src/theme/tokens';

type Props = {
  /** 0 – 1 */
  value: number;
  height?: number;
  tone?: 'gold' | 'navy';
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

export function ProgressBar({ value, height = 6, tone = 'gold', style, accessibilityLabel }: Props) {
  const pct = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
  return (
    <View
      style={[
        styles.track,
        { height, backgroundColor: tone === 'gold' ? colors.surfaceSunken : 'rgba(9, 30, 48, 0.14)' },
        style,
      ]}
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(pct * 100) }}
    >
      {tone === 'gold' ? (
        <LinearGradient
          colors={gradients.gold}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.fill, { width: `${pct * 100}%` }]}
        />
      ) : (
        <View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: colors.textOnGold }]} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { borderRadius: radii.pill, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radii.pill },
});
