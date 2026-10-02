import { Image, type ImageStyle, type StyleProp } from 'react-native';

type Props = {
  height?: number;
  style?: StyleProp<ImageStyle>;
};

export function BrandLogo({ height = 56, style }: Props) {
  // Source asset is a portrait lockup (212 × 372).
  const width = Math.round(height * (212 / 372));
  return (
    <Image
      source={require('../../assets/ahc-logo-white.png')}
      style={[{ width, height }, style]}
      resizeMode="contain"
      accessibilityRole="image"
      accessibilityLabel="Abu Huraira Center logo"
    />
  );
}
