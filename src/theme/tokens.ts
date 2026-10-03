/**
 * Abu Huraira Center (AHC) design system tokens.
 *
 * Brand colours (navy, gold, nur, pearl, CTA amber) were captured from
 * MasjidOps — see BRANDING.md. Everything else in this file (navy surface
 * ramp, text opacities, spacing/radius/type scales, elevation) is *derived*
 * from those brand colours so the whole app shares one visual language.
 *
 * Import from `@/src/theme/tokens` — avoid hard-coding values in screens.
 */
import type { TextStyle, ViewStyle } from 'react-native';

/* ------------------------------------------------------------------ */
/* Colour                                                              */
/* ------------------------------------------------------------------ */

/** Navy ramp derived from brand navy #0a2236 (darkest → lightest). */
export const navy = {
  950: '#050f19',
  900: '#071827',
  850: '#091e30',
  800: '#0a2236', // brand primary
  750: '#0d2a42',
  700: '#11314c',
  600: '#173c5b',
  500: '#21496b',
} as const;

export const colors = {
  /* Brand (captured) */
  primary: navy[800],
  navy: navy[800],
  gold: '#ffbb50',
  goldStops: ['#ffc247', '#ffbb50', '#f4941b'] as const,
  goldDeep: '#f4941b',
  nur: '#f5b860',
  ctaAmber: ['#fbbf24', '#fb923c', '#facc15'] as const,
  ctaStart: '#fbbf24',
  ctaMid: '#fb923c',
  ctaEnd: '#facc15',
  pearl: '#f5f0e8',
  pearlText: '#091e30',
  white: '#ffffff',

  /* Backgrounds */
  bg: navy[900],
  bgGradient: ['#091e30', '#0a2236', '#071827'] as const,
  /** Hero header wash: brand navy lifting slightly toward the top. */
  heroGradient: ['#173c5b', '#0d2a42', '#071827'] as const,

  /* Surfaces ("plates") — opaque so shadows read cleanly */
  surface: navy[750],
  surfaceRaised: navy[700],
  surfacePressed: navy[600],
  surfaceSunken: 'rgba(5, 15, 25, 0.45)',

  /* Lines */
  hairline: 'rgba(255, 255, 255, 0.08)',
  hairlineStrong: 'rgba(255, 255, 255, 0.14)',
  highlight: 'rgba(255, 255, 255, 0.06)', // top-edge sheen on plates
  goldHairline: 'rgba(255, 187, 80, 0.32)',

  /* Text (pearl at fixed opacities; all ≥ 4.5:1 on surface) */
  text: '#f5f0e8',
  textSecondary: 'rgba(245, 240, 232, 0.74)',
  textTertiary: 'rgba(245, 240, 232, 0.58)',
  textOnGold: '#091e30',
  textOnGoldMuted: 'rgba(9, 30, 48, 0.72)',

  /* Tints */
  goldTint: 'rgba(255, 187, 80, 0.12)',
  goldTintStrong: 'rgba(255, 187, 80, 0.2)',
  pearlTint: 'rgba(245, 240, 232, 0.06)',
  /** Fill for gold-accented tiles: a clean navy lift (gold alpha on navy reads olive). */
  accentFill: 'rgba(255, 255, 255, 0.05)',
  accentFillStrong: navy[600],

  /* Status */
  success: '#4ade80',
  successTint: 'rgba(74, 222, 128, 0.14)',
  warning: '#fbbf24',
  warningTint: 'rgba(251, 191, 36, 0.12)',
  danger: '#f87171',
  dangerTint: 'rgba(248, 113, 113, 0.12)',

  /* Legacy aliases (kept for older code paths) */
  muted: 'rgba(245, 240, 232, 0.74)',
  mutedStrong: 'rgba(245, 240, 232, 0.86)',
  cardBg: navy[750],
  cardBorder: 'rgba(255, 255, 255, 0.08)',
  inputBg: 'rgba(5, 15, 25, 0.45)',
} as const;

export type GradientStops = readonly [string, string, ...string[]];
export const gradients = {
  gold: colors.goldStops as GradientStops,
  cta: colors.ctaAmber as GradientStops,
  hero: colors.heroGradient as GradientStops,
  bg: colors.bgGradient as GradientStops,
  /** Subtle plate gradient for featured cards */
  plate: ['#143856', '#0d2a42'] as GradientStops,
  /** Hero header wash — vertical, ends fully transparent so it melts into the bg */
  heroWash: [
    '#173c5b',
    'rgba(21, 56, 86, 0.88)',
    'rgba(17, 49, 76, 0.66)',
    'rgba(14, 44, 69, 0.42)',
    'rgba(12, 38, 61, 0.2)',
    'rgba(10, 34, 54, 0.06)',
    'rgba(10, 34, 54, 0)',
  ] as GradientStops,
  /** Corner light layered over the hero wash (also ends transparent) */
  heroGlow: ['rgba(255, 187, 80, 0.07)', 'rgba(255, 187, 80, 0)'] as GradientStops,
  /** Fade used under hero headers */
  fadeToBg: ['rgba(7, 24, 39, 0)', navy[900]] as GradientStops,
} as const;

/* ------------------------------------------------------------------ */
/* Spacing — 4pt grid                                                  */
/* ------------------------------------------------------------------ */

export const spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  ms: 12,
  md: 16,
  ml: 20,
  lg: 24,
  xl: 32,
  xxl: 40,
  xxxl: 56,
} as const;

/** Horizontal gutter for screen content. */
export const layout = {
  gutter: 20,
  /** Content column cap — keeps line lengths comfortable on iPad / tablets. */
  maxContentWidth: 680,
  tabBarHeight: 64,
  /** Floating glass tab bar (capsule height, excluding the home-indicator gap). */
  floatingTabBarHeight: 70,
} as const;

/* ------------------------------------------------------------------ */
/* Radius                                                              */
/* ------------------------------------------------------------------ */

export const radii = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  card: 20,
  xl: 24,
  xxl: 32,
  pill: 999,
} as const;

/* ------------------------------------------------------------------ */
/* Typography                                                          */
/* ------------------------------------------------------------------ */

export const fonts = {
  /* Display — Playfair Display (brand heading face) */
  display: 'PlayfairDisplay_700Bold',
  displaySemi: 'PlayfairDisplay_600SemiBold',
  displayItalic: 'PlayfairDisplay_400Regular_Italic',
  /* UI — Inter */
  ui: 'Inter_400Regular',
  uiMedium: 'Inter_500Medium',
  uiSemi: 'Inter_600SemiBold',
  uiBold: 'Inter_700Bold',
  /* Arabic — Amiri */
  arabic: 'Amiri_400Regular',
  arabicBold: 'Amiri_700Bold',

  /* Legacy aliases */
  heading: 'PlayfairDisplay_700Bold',
  headingSemi: 'PlayfairDisplay_600SemiBold',
  body: 'Inter_400Regular',
  bodyBold: 'Inter_600SemiBold',
} as const;

const tabular: TextStyle = { fontVariant: ['tabular-nums'] };

export const typography = {
  /** Big hero numbers / headline moments */
  display: { fontFamily: fonts.display, fontSize: 36, lineHeight: 42, letterSpacing: -0.4 },
  largeTitle: { fontFamily: fonts.display, fontSize: 32, lineHeight: 38, letterSpacing: -0.3 },
  title1: { fontFamily: fonts.display, fontSize: 26, lineHeight: 32, letterSpacing: -0.2 },
  title2: { fontFamily: fonts.displaySemi, fontSize: 21, lineHeight: 27 },
  title3: { fontFamily: fonts.uiSemi, fontSize: 18, lineHeight: 24, letterSpacing: -0.2 },
  headline: { fontFamily: fonts.uiSemi, fontSize: 16, lineHeight: 22, letterSpacing: -0.1 },
  body: { fontFamily: fonts.ui, fontSize: 16, lineHeight: 24 },
  callout: { fontFamily: fonts.ui, fontSize: 15, lineHeight: 22 },
  subhead: { fontFamily: fonts.ui, fontSize: 14, lineHeight: 20 },
  footnote: { fontFamily: fonts.ui, fontSize: 13, lineHeight: 18 },
  caption: { fontFamily: fonts.uiMedium, fontSize: 12, lineHeight: 16 },
  overline: {
    fontFamily: fonts.uiSemi,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  button: { fontFamily: fonts.uiSemi, fontSize: 16, lineHeight: 20, letterSpacing: -0.1 },
  numeric: { fontFamily: fonts.uiSemi, fontSize: 16, lineHeight: 22, ...tabular },
  numericLarge: { fontFamily: fonts.uiBold, fontSize: 40, lineHeight: 46, letterSpacing: -1, ...tabular },
  arabic: { fontFamily: fonts.arabic, fontSize: 20, lineHeight: 32 },

  /* Legacy aliases */
  h1: { fontFamily: fonts.display, fontSize: 28, lineHeight: 34 },
  h2: { fontFamily: fonts.displaySemi, fontSize: 22, lineHeight: 28 },
  h3: { fontFamily: fonts.uiSemi, fontSize: 18, lineHeight: 24 },
  bodySm: { fontFamily: fonts.ui, fontSize: 14, lineHeight: 20 },
} satisfies Record<string, TextStyle>;

/* ------------------------------------------------------------------ */
/* Elevation — layered, low-opacity shadows                            */
/* ------------------------------------------------------------------ */

function shadow(css: string): ViewStyle {
  // `boxShadow` is supported by React Native 0.76+ (New Architecture, enabled in
  // app.json) on iOS/Android and by react-native-web, so one value works everywhere.
  return { boxShadow: css };
}

export const elevation = {
  none: {} as ViewStyle,
  /** Resting plate */
  sm: shadow('0px 1px 2px rgba(0, 0, 0, 0.22), 0px 4px 12px rgba(0, 0, 0, 0.16)'),
  /** Featured plate */
  md: shadow('0px 2px 4px rgba(0, 0, 0, 0.24), 0px 12px 28px rgba(0, 0, 0, 0.26)'),
  /** Hero / floating */
  lg: shadow('0px 4px 8px rgba(0, 0, 0, 0.26), 0px 20px 44px rgba(0, 0, 0, 0.34)'),
  /** Warm glow under gold elements */
  gold: shadow('0px 6px 14px rgba(244, 148, 27, 0.22), 0px 18px 40px rgba(244, 148, 27, 0.18)'),
} as const;

/* ------------------------------------------------------------------ */
/* Motion                                                              */
/* ------------------------------------------------------------------ */

export const motion = {
  pressScale: 0.97,
  spring: { damping: 18, stiffness: 320, mass: 0.6 },
} as const;

/* ------------------------------------------------------------------ */
/* Brand & locale                                                      */
/* ------------------------------------------------------------------ */

export const locale = {
  currency: 'CAD',
  currencySymbol: '$',
  timezone: 'America/Toronto',
  language: 'en-CA',
} as const;

export const brand = {
  name: 'Abu Huraira Center',
  shortName: 'AHC',
  tagline: 'A house of worship, learning, and community',
  website: 'https://abuhuraira.org',
  email: 'info@abuhuraira.org',
  /* Contact details from abuhuraira.org (footer + /contact), 2026-10-02.
     Muslimoon's org-settings footer.contact_info is empty today; values from
     there override these when present (see useStaticDetails). */
  address: '270 Yorkland Blvd, North York, ON M2J 5C9',
  mapsQuery: '270 Yorkland Blvd, North York, ON M2J 5C9',
  phone: '416-752-1200',
  /* YouTube fallback until the handle is set in Muslimoon (Settings >
     Static Details). Verified 2026-10-02: youtube.com/abuhurairacenter
     redirects to @AbuHurairaCenter, channel UCP9ej92hIt-X16--0_MMwPA. */
  youtube: {
    handle: '@AbuHurairaCenter',
    channelUrl: 'https://www.youtube.com/@AbuHurairaCenter',
    liveUrl: 'https://www.youtube.com/@AbuHurairaCenter/live',
  },
  socials: {
    instagram: 'https://www.instagram.com/abuhurairacenter/',
    facebook: 'https://www.facebook.com/AbuHurairaCenter/',
    tiktok: 'https://www.tiktok.com/@abuhurairacenter',
  },
} as const;
