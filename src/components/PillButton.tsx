import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { Button, type ButtonVariant } from './Button';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'cta' | 'gold' | 'outline' | 'pearl';
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

const MAP: Record<NonNullable<Props['variant']>, ButtonVariant> = {
  cta: 'primary',
  gold: 'primary',
  outline: 'outline',
  pearl: 'secondary',
};

/** @deprecated Use `Button` — kept so older imports keep working. */
export function PillButton({ variant = 'cta', ...rest }: Props) {
  return <Button variant={MAP[variant]} {...rest} />;
}
