import { useEffect, useState } from 'react';
import { Keyboard, Platform, useWindowDimensions } from 'react-native';

/**
 * Screen-size buckets used to tune dense layouts.
 *  - compact: small phones (iPhone SE 1st gen, small Androids) — width < 360
 *  - regular: everyday phones
 *  - tablet:  iPad / Android tablets — width ≥ 700
 */
export function useResponsive() {
  const { width, height, fontScale } = useWindowDimensions();
  const compact = width < 360;
  const tablet = Math.min(width, height) >= 600 && width >= 700;
  return { width, height, fontScale, compact, tablet, large: fontScale > 1.2 };
}

/** True while the software keyboard is on screen. */
export function useKeyboardVisible() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const a = Keyboard.addListener(showEvt, () => setVisible(true));
    const b = Keyboard.addListener(hideEvt, () => setVisible(false));
    return () => {
      a.remove();
      b.remove();
    };
  }, []);
  return visible;
}

/** Caps for Dynamic Type / Android font scaling on dense UI. */
export const FONT_CAP = {
  /** Tab labels, table cells, chips — tight spaces. */
  dense: 1.25,
  /** Body copy — let it grow, but not break layouts. */
  body: 1.6,
} as const;
