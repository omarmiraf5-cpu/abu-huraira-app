# AHC Branding Notes

Brand tokens for the Abu Huraira Center mobile app live in `src/theme/tokens.ts` and should be used everywhere (screens, components, splash/tab chrome).

## Captured tokens (MasjidOps)

These values were captured from existing MasjidOps / AHC digital surfaces and are the working source of truth until a formal brand book is published.

| Token | Value |
| --- | --- |
| Primary navy | `#0a2236` |
| Background gradient | `#091e30` → `#0a2236` → `#071827` |
| Gold | `#ffbb50` |
| Gold stops | `#ffc247` → `#ffbb50` → `#f4941b` |
| Nur | `#f5b860` |
| CTA amber | `#fbbf24` → `#fb923c` → `#facc15` |
| Pearl | `#f5f0e8` (text on pearl: `#091e30`) |
| Card radius | `16` |
| Buttons | Pill shape |
| Currency / locale | CAD, `en-CA` |
| Timezone | `America/Toronto` |

## Typography

Loaded via `expo-google-fonts` (subpath imports, so only these weights ship):

- Display / headings: **Playfair Display** 600, 700 (+ 400 italic)
- UI / body / numbers: **Inter** 400, 500, 600, 700 (tabular figures for times and amounts)
- Arabic: **Amiri** 400, 700 when Arabic copy is shown

Lato, Montserrat, and Cormorant Garamond were dropped in the premium redesign (Inter replaces Lato as the UI face for crisper small text and numerals).

## Design system (premium redesign)

All values live in `src/theme/tokens.ts`. Only the captured brand colours above are "brand"; everything below is derived from them.

| Token group | Values |
| --- | --- |
| Navy ramp | `navy[950…500]` from `#050f19` to `#21496b` (surfaces = `750`/`700`) |
| Text | pearl at 100% / 74% / 58% opacity, all ≥ 4.5:1 on every surface |
| Lines | hairline `rgba(255,255,255,0.08)`, gold hairline `rgba(255,187,80,0.32)` |
| Spacing | 4-pt grid: 2, 4, 8, 12, 16, 20, 24, 32, 40, 56; screen gutter 20 |
| Radius | 6, 10, 14, 18, **20 (cards)**, 24 (hero cards), 32, pill |
| Type scale | display 36 · largeTitle 32 · title1 26 · title2 21 · title3 18 · headline 16 · body 16 · callout 15 · subhead 14 · footnote 13 · caption 12 · overline 11 |
| Elevation | `elevation.sm/md/lg/gold` — layered low-opacity `boxShadow` (New Architecture + web) |
| Motion | press scale 0.97 spring + light selection haptic (native) |

Shared components in `src/components/`: `Screen`, `HeroHeader`, `Card` (plate / featured / gold / tint / outline / sunken), `Button` (`PillButton` kept as a wrapper), `SectionHeader`, `Badge`, `IconBadge`, `Icon`, `ListGroup`/`ListRow`, `TextField`, `ProgressBar`, `EmptyState`, `EventCard`, `GeometricPattern`, `StarMedallion`, `PressableScale`, `prayer/NextPrayerHero`.

Islamic geometric touch: a hairline 8-point-star (khatam) lattice (`GeometricPattern`, gold at ≤14% opacity, fading out) behind hero headers and the featured cards, and an 8-point-star medallion for empty states and the More-tab logo. Keep it subtle — never behind body text at full strength.

## Logo

White logo asset: `assets/ahc-logo-white.png`  
Source: `/workspace/ahc-brand/ahc-logo-white.png` (also available at the public Supabase logos bucket).

## Icons and app icon (premium pass, 2026-10-01)

- **Custom duotone glyph set** — `src/components/icons/glyphs.ts` (28 glyphs, 24px grid, 1.75 stroke), rendered by `Glyph.tsx`. `Icon` maps common stock names (home, calendar, heart, mail…) to these automatically; chevrons/checkmarks stay Ionicons.
- **Jewel tiles** — `src/components/icons/JewelIcon.tsx`: gradient + specular highlight + rim + coloured glow. Destination tones (sapphire, violet, rose, emerald, teal, gold, slate) and sky tones per prayer (fajr, dhuhr, asr, maghrib, isha). Every white-glyph tone's middle stop holds ≥ 3:1 against white.
- These jewel/sky colours are an **intentional addition** for icon tiles only (never text, buttons or backgrounds) and need sign-off alongside the brand book.
- **App icon** — gold logo inside a gold eight-point star on navy (`assets/images/icon.png` + Android adaptive layers + favicon).
- The full system (tokens, type, icons, components, usage rules) is published as the "Abu Huraira Center App" design system artifact for review.

## Pending

- Formal **brand book** (spacing system, photography, Arabic lockups, print vs digital variants) is still pending.
- Contact address/phone on the More tab are stubs until verified from MasjidOps / brand book.
- Do not invent additional brand colors or alternate logos without design sign-off.

## Usage

Import from `@/src/theme/tokens` — avoid hard-coding hex values in screens.
