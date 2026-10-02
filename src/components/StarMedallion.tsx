import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors } from '@/src/theme/tokens';
import { eightPointStar } from './geometry';
import { Icon, type IconName } from './Icon';

type Props = {
  icon: IconName;
  size?: number;
  tone?: 'gold' | 'navy';
};

/** An icon set inside an 8-point star — used for empty states and brand moments. */
export function StarMedallion({ icon, size = 88, tone = 'gold' }: Props) {
  const c = size / 2;
  const stroke = tone === 'gold' ? colors.gold : colors.textOnGold;
  return (
    <View style={{ width: size, height: size }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Path
          d={eightPointStar(c, c, c - 1)}
          fill={tone === 'gold' ? colors.accentFill : 'rgba(9, 30, 48, 0.08)'}
          stroke={stroke}
          strokeOpacity={0.55}
          strokeWidth={1}
        />
        <Path
          d={eightPointStar(c, c, c * 0.72)}
          fill="none"
          stroke={stroke}
          strokeOpacity={0.25}
          strokeWidth={1}
        />
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center]}>
        <Icon name={icon} size={size * 0.3} color={stroke} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
});
