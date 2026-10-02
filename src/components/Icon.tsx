import type { ComponentProps } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { ColorValue, StyleProp, TextStyle } from 'react-native';
import { Glyph } from './icons/Glyph';
import { GLYPHS, type GlyphName } from './icons/glyphs';

type IonName = ComponentProps<typeof Ionicons>['name'];

/** The few MaterialCommunityIcons glyphs Ionicons doesn't have. */
const MCI = [
  'mosque',
  'mosque-outline',
  'hand-heart',
  'hand-heart-outline',
  'weather-sunset',
  'weather-sunset-up',
  'weather-sunset-down',
  'star-four-points-outline',
] as const;
type MciName = (typeof MCI)[number];

export type IconName = IonName | MciName | GlyphName;

/**
 * Stock icon names that are upgraded to the AHC custom duotone set.
 * `true` = render the filled (active) variant.
 */
const UPGRADE: Record<string, [GlyphName, boolean]> = {
  home: ['home', true],
  'home-outline': ['home', false],
  mosque: ['mosque', true],
  'mosque-outline': ['mosque', false],
  calendar: ['calendar', true],
  'calendar-outline': ['calendar', false],
  'calendar-clear-outline': ['calendar', false],
  heart: ['heart', true],
  'heart-outline': ['heart', false],
  'hand-heart': ['give', true],
  'hand-heart-outline': ['give', false],
  grid: ['more', true],
  'grid-outline': ['more', false],
  'globe-outline': ['globe', false],
  'earth-outline': ['globe', false],
  'mail-outline': ['mail', false],
  'location-outline': ['pin', false],
  'call-outline': ['phone', false],
  'information-circle-outline': ['info', false],
  'cloud-outline': ['cloud', false],
  'shield-checkmark-outline': ['shield', false],
  'sunny-outline': ['sunrise', false],
  'leaf-outline': ['leaf', false],
  'book-outline': ['book', false],
  'people-outline': ['people', false],
  'restaurant-outline': ['food', false],
  'sparkles-outline': ['sparkles', false],
  'moon-outline': ['crescent', false],
  'time-outline': ['clock', false],
};

type Props = {
  name: IconName;
  size?: number;
  color?: ColorValue;
  /** Duotone accent (custom glyphs only). */
  accent?: ColorValue;
  /** Force the filled duotone variant (custom glyphs only). */
  filled?: boolean;
  style?: StyleProp<TextStyle>;
};

const mciSet = new Set<string>(MCI);

/**
 * Single icon entry point. Brand concepts render from the AHC custom duotone
 * set (see icons/glyphs.ts); small UI affordances (chevrons, checkmarks…) use
 * Ionicons, with a handful of MaterialCommunityIcons.
 */
export function Icon({ name, size = 20, color, accent, filled, style }: Props) {
  const upgraded = UPGRADE[name];
  if (upgraded || name in GLYPHS) {
    const [glyph, defFilled] = upgraded ?? [name as GlyphName, false];
    return (
      <Glyph
        name={glyph}
        size={size * 1.05}
        color={color}
        accent={accent}
        filled={filled ?? defFilled}
        style={style as never}
      />
    );
  }
  if (mciSet.has(name)) {
    return (
      <MaterialCommunityIcons
        name={name as MciName}
        size={size}
        color={color as string}
        style={style}
        accessibilityElementsHidden
        importantForAccessibility="no"
      />
    );
  }
  return (
    <Ionicons
      name={name as IonName}
      size={size}
      color={color as string}
      style={style}
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  );
}
