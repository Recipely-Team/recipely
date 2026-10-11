# Recipely Design Specification

> This document is the authoritative design reference for the Recipely mobile app visual upgrade.
> Every section contains exact values (hex colors, pixel sizes, prop interfaces) so that
> developer agents can implement without ambiguity.

---

## Theme Palette Strategy (Apr 2026 redesign)

### Why this section exists

Real-device QA (Android, OLED) revealed two production-blocking issues that the previous
"low-luminance tinted backgrounds" iteration did not catch:

1. **All dark themes read as the same near-black.** Hex values like `#1A0505`, `#1A0D00`,
   `#0A1400` are hex-distinct but visually identical on a phone screen — relative luminance
   in the 0.003-0.009 band, with chroma so muted it disappears under typical room lighting.
   The 20-theme picker is therefore visually meaningless in dark variants.

2. **`primaryText` is being misused as "text on overlay/badge".** In dark themes the project
   contracts `primaryText` to be a DARK hex (because `primary` is a bright pastel). When the
   recipe-card difficulty chip rendered `primaryText` over `colors.overlay`, it produced
   dark-on-dark invisible text. Same pattern in checkbox/task widgets that render checkmarks
   over `colors.success`.

This section is the source of truth that fixes both. Sections below (A-H) keep their previous
content, but **all `background` and `surface` values they reference are superseded by the
table in this section**, and all "text on overlay / on success" rules are superseded by the
new semantic tokens defined here.

### References (Apr 2026 design research)

- **[Material 3 — Color roles](https://m3.material.io/styles/color/roles)** — adopted the
  "tonal surface elevation" idea: surface is not a fixed gray, it inherits the primary hue
  family at a higher tonal step. Our dark surfaces mix the per-theme background toward a
  warm-neutral elevation target `#52535A` so cards lift visibly off the bg without losing
  the theme tint.
- **[Mobbin — Mobile Dark Mode patterns](https://mobbin.com/explore/mobile/screens/dark-mode)** —
  surveyed Yummly, Tasty, Linear, Finimize. Common pattern: dark backgrounds carry 3-8% of
  the brand hue's chroma even at L≈0.01, and cards sit ~30-45% lighter than bg via tonal
  elevation rather than a flat gray surface.
- **[Designing Dark Mode for Mobile (2026 guide)](https://appinventiv.com/blog/guide-on-designing-dark-mode-for-mobile-app/)** —
  reinforced WCAG bg/text floor of 7:1 for body in dark mode (we hit ≥10.1:1 on every
  surf/text pair; ≥11.2:1 on every bg/text pair).

### A. Background palette redesign — DARK variants

Target relative luminance band: **[0.003, 0.020]**. Sibling themes within the same hue
family are spread across this band by ≥0.0015 luminance OR shifted in hue (peach vs rose
vs wine for the warm reds). **Surface synthesis target moves from `#3A3B41` to `#52535A`**
so cards hit a 1.4-1.5:1 contrast against bg (previous 1.2:1 was visually flat).

| Theme ID            | Old bg       | New bg       | Luminance | Synthesized surface | bg/surf | surf/text |
|---------------------|--------------|--------------|-----------|---------------------|---------|-----------|
| midnight-slate      | `#0B0B0D`    | `#0B0F1A`    | 0.0049    | `#2F313A`           | 1.48    | 11.82     |
| pearl-white         | `#050A14`    | `#0A1A33`    | 0.0104    | `#2E3747`           | 1.45    | 10.93     |
| crimson-ember       | `#1A0505`    | `#1A0309`    | 0.0030    | `#362B32`           | 1.46    | 12.38     |
| amber-sunset        | `#1A0D00`    | `#190A00`    | 0.0042    | `#362F2D`           | 1.48    | 11.97     |
| golden-hour         | `#1A1500`    | `#1A1300`    | 0.0069    | `#36332D`           | 1.47    | 11.49     |
| lime-zest           | `#0A1400`    | `#0A1700`    | 0.0068    | `#2E352D`           | 1.46    | 11.52     |
| emerald-garden      | `#001A12`    | `#021A14`    | 0.0080    | `#2A3737`           | 1.47    | 11.28     |
| teal-lagoon         | `#001715`    | `#021A1D`    | 0.0084    | `#2A373C`           | 1.46    | 11.21     |
| cyan-frost          | `#00121C`    | `#02141C`    | 0.0060    | `#2A343B`           | 1.48    | 11.60     |
| ocean-deep          | `#001929`    | `#021024`    | 0.0051    | `#2A323F`           | 1.48    | 11.79     |
| indigo-night        | `#0A0A1E`    | `#0B0824`    | 0.0037    | `#2F2E3F`           | 1.47    | 12.11     |
| violet-bloom        | `#0D0A1E`    | `#100620`    | 0.0034    | `#312D3D`           | 1.47    | 12.18     |
| royal-purple        | `#0D0619`    | `#180628`    | 0.0048    | `#352D41`           | 1.46    | 11.96     |
| fuchsia-flash       | `#1A0010`    | `#22042A`    | 0.0059    | `#3A2C42`           | 1.45    | 11.84     |
| rose-quartz         | `#1A0008`    | `#22030E`    | 0.0044    | `#3A2B34`           | 1.45    | 12.17     |
| coral-reef          | `#1A0008`    | `#2C0A14`    | 0.0080    | `#3F2F37`           | 1.44    | 11.46     |
| mint-breeze         | `#001715`    | `#072B26`    | 0.0191    | `#2D3F40`           | 1.37    | 10.11     |
| tangerine-dream     | `#1A0D00`    | `#2A1208`    | 0.0094    | `#3E3331`           | 1.45    | 11.13     |
| lavender-mist       | `#0D0A1E`    | `#1F1733`    | 0.0114    | `#393547`           | 1.44    | 10.80     |
| chartreuse-zap      | `#0A1400`    | `#162A00`    | 0.0183    | `#343F2D`           | 1.39    | 10.12     |

Sibling-pair luminance separation (the old palette had pairs like `crimson/rose/coral` all
at `#1A0008`/`#1A0008`/`#1A0008` — literally identical):

| Sibling group                                              | Luminance values                                |
|------------------------------------------------------------|-------------------------------------------------|
| crimson-ember / rose-quartz / coral-reef                   | 0.0030 / 0.0044 / 0.0080 — coral lifts via L+hue |
| amber-sunset / tangerine-dream                             | 0.0042 / 0.0094 — tangerine 2× brighter         |
| lime-zest / chartreuse-zap                                 | 0.0068 / 0.0183 — chartreuse 2.7× brighter      |
| emerald-garden / mint-breeze / teal-lagoon                 | 0.0080 / 0.0191 / 0.0084 — mint lifts via L     |
| violet-bloom / lavender-mist / royal-purple / indigo-night | 0.0034 / 0.0114 / 0.0048 / 0.0037 — lavender lifts |

### A. Background palette redesign — LIGHT variants

Target band: **[0.74, 0.95]**. Light backgrounds in the previous palette were `#FFF*` near-
whites that all looked identical too. We tint backgrounds with stronger hue chroma
(luminance 0.78-0.90) and move the **surface synthesis to mix toward pure `#FFFFFF` at 0.55**
so cards "lift" toward white. Body text against any bg or any surface stays ≥14.7:1.

| Theme ID            | Old bg       | New bg       | Luminance | Synthesized surface | surf/bg | surf/text |
|---------------------|--------------|--------------|-----------|---------------------|---------|-----------|
| midnight-slate      | `#FFFFFF`    | `#F2F4F7`    | 0.9029    | `#F9FAFB`           | 1.05    | 17.08     |
| pearl-white         | `#FFFFFF`    | `#E8EFFB`    | 0.8585    | `#F5F8FD`           | 1.09    | 16.77     |
| crimson-ember       | `#FEF2F2`    | `#FBE7E7`    | 0.8343    | `#FDF4F4`           | 1.10    | 16.51     |
| amber-sunset        | `#FFF7ED`    | `#FFEFD9`    | 0.8800    | `#FFF8EE`           | 1.07    | 16.93     |
| golden-hour         | `#FEFCE8`    | `#FCF3BF`    | 0.8856    | `#FEFAE2`           | 1.07    | 16.99     |
| lime-zest           | `#F7FEE7`    | `#EAF7C8`    | 0.8818    | `#F6FBE6`           | 1.07    | 16.88     |
| emerald-garden      | `#ECFDF5`    | `#D6F2E2`    | 0.8329    | `#EDF9F2`           | 1.10    | 16.52     |
| teal-lagoon         | `#F0FDFA`    | `#D2F1EC`    | 0.8267    | `#EBF9F6`           | 1.11    | 16.50     |
| cyan-frost          | `#ECFEFF`    | `#D5F1F8`    | 0.8383    | `#ECF9FC`           | 1.10    | 16.60     |
| ocean-deep          | `#F0F9FF`    | `#D9ECFC`    | 0.8177    | `#EEF6FE`           | 1.11    | 16.36     |
| indigo-night        | `#EEF2FF`    | `#DCDFFB`    | 0.7496    | `#EFF1FD`           | 1.17    | 15.87     |
| violet-bloom        | `#F5F3FF`    | `#E8DEFB`    | 0.7636    | `#F5F0FD`           | 1.15    | 15.95     |
| royal-purple        | `#FAF5FF`    | `#EDDDFB`    | 0.7668    | `#F7F0FD`           | 1.15    | 16.01     |
| fuchsia-flash       | `#FDF4FF`    | `#F8DDF7`    | 0.7838    | `#FCF0FB`           | 1.14    | 16.15     |
| rose-quartz         | `#FFF1F2`    | `#FCDDE3`    | 0.7795    | `#FEF0F2`           | 1.14    | 16.12     |
| coral-reef          | `#FFF5F5`    | `#FFE0D8`    | 0.7953    | `#FFF1ED`           | 1.13    | 16.20     |
| mint-breeze         | `#F0FDFA`    | `#DAF3EC`    | 0.8506    | `#EEFAF6`           | 1.09    | 16.70     |
| tangerine-dream     | `#FFF7ED`    | `#FFE0C2`    | 0.7847    | `#FFF1E4`           | 1.14    | 16.11     |
| lavender-mist       | `#F5F3FF`    | `#EBE2FB`    | 0.7902    | `#F6F2FD`           | 1.13    | 16.18     |
| chartreuse-zap      | `#F7FEE7`    | `#E0F5B5`    | 0.8449    | `#F1FBDE`           | 1.09    | 16.66     |

Light siblings differentiate primarily by **hue family** (e.g., crimson rose-leaning vs
coral peach-leaning) — at high luminance, hue is more perceptually distinct than L itself.

### B. New semantic tokens (tight: only 2 added)

Add to `ThemeColors` interface in `themes.ts`:

```ts
export interface ThemeColors {
  // ... all existing fields unchanged ...

  /**
   * Text/icon color for content sitting on `colors.overlay` (semi-transparent dark
   * backdrop on hero images, recipe-card chips). ALWAYS white in both variants —
   * overlays are darken-by-design regardless of theme variant.
   */
  onOverlay: string;

  /**
   * Text/icon color for content sitting on `colors.success` (checkmarks in checkbox/
   * task widgets, success-state badge fill). ALWAYS dark in both variants — `success`
   * is always a green tinted toward 0.4-0.5 luminance and requires dark text.
   */
  onSuccess: string;
}
```

| Token       | Dark value | Light value | Rationale                                                              |
|-------------|-----------|-------------|------------------------------------------------------------------------|
| `onOverlay` | `#FFFFFF` | `#FFFFFF`   | Overlay is `rgba(0,0,0,0.6)` → effective backdrop ≤ #6B6B6B → cr ≥4.74 |
| `onSuccess` | `#0F1B0F` | `#0F1B0F`   | Success greens (`#81C995` / `#34A853`) → cr 9.12 / 5.84                |

`primaryText` keeps its current contract: "text on `colors.primary`". It is NOT a
generic "text on dark surface" token, so the recipe-card / checkbox / task widgets must
stop using it for non-primary backdrops.

### C. Overlay alpha bump (dark-image legibility)

The previous `lightSemantics.overlay = rgba(15,23,42,0.35)` is too transparent for
readable white text — over a white pixel under the overlay, white text computes 2.22:1
(fails AA). Standardize:

```ts
const darkSemantics: VariantSemantics = {
  // ... unchanged ...
  overlay: 'rgba(0,0,0,0.6)',     // was 0.55 — bumped for chip legibility
};
const lightSemantics: VariantSemantics = {
  // ... unchanged ...
  overlay: 'rgba(0,0,0,0.55)',    // was rgba(15,23,42,0.35) — black, alpha 0.55
};
```

Verified pairings (white text via `onOverlay` on `rgba(0,0,0,0.6)` over image pixels):

| Image pixel under overlay | Effective backdrop | cr (white) |
|---------------------------|--------------------|------------|
| `#FFFFFF` (worst case)    | `#666666`          | 5.74       |
| `#F2C04D` (pizza orange)  | `#614D1F`          | 8.11       |
| `#7F7F7F` (mid gray)      | `#333333`          | 12.63      |
| `#E0E0E0` (bright sky)    | `#5A5A5A`          | 6.90       |

All pass WCAG AA (≥4.5:1) for normal text.

### D. WCAG checks performed

For each of the 20 themes, verified:

- `bg / text` contrast ≥ 11.2:1 (every dark theme), ≥ 14.7:1 (every light theme).
- `surface / text` contrast ≥ 10.1:1 (every dark theme), ≥ 15.8:1 (every light theme).
- `bg / surface` contrast 1.37-1.48:1 (dark), 1.05-1.17:1 (light) — combined with the
  existing `cardBorder` hairline, cards are visibly distinct from bg in both variants.
- `onOverlay` on darken-applied image pixels (4 sample tones from white→black): all ≥4.74.
- `onSuccess` on `colors.success` in both variants: 9.12 (dark) / 5.84 (light).
- `primaryText` on `colors.primary` in all 20 themes: unchanged, all ≥7.0 (already
  validated in previous spec — primary themes already paired primaryText correctly).

Sibling-pair luminance deltas (dark variants): 5 of 5 sibling groups now separate by
≥0.0015 in L OR by hue family. No two dark backgrounds share both hue family and L band.

---

## A. Foundations — contrast rules and tokens

### Contrast regression rules

Add a contrast-suite in `__tests__/` (or `application/__tests__/contrast.test.ts`) that
iterates `ALL_THEMES` × `['light', 'dark']` and asserts:

1. **Per-theme bg/text floor**:
   - dark: `contrastRatio(colors.background, colors.text) >= 11.0`
   - light: `contrastRatio(colors.background, colors.text) >= 14.0`

2. **Per-theme surf/text floor** (new — was untested):
   - dark: `contrastRatio(colors.surface, colors.text) >= 10.0`
   - light: `contrastRatio(colors.surface, colors.text) >= 15.0`

3. **Per-theme bg/surf separation** (new — guards card visibility regression):
   - dark: `contrastRatio(colors.background, colors.surface) >= 1.35`
   - light: `contrastRatio(colors.background, colors.surface) >= 1.04`

4. **Per-theme onSuccess pair** (new):
   - both variants: `contrastRatio(colors.success, colors.onSuccess) >= 4.5`

5. **Per-theme onOverlay pair simulated** (new — overlay sits on a worst-case white
   image pixel; assert white text passes against the resulting alpha-blended backdrop):
   - both variants: white-on-`#666666` ≥ 4.5 (effective backdrop after 0.6 alpha black
     overlay over `#FFFFFF`). Implement as a pure helper `simulateOverlayBackdrop(image,
     overlayHex, alpha)` that returns the blended hex, then assert
     `contrastRatio(colors.onOverlay, simulateOverlayBackdrop('#FFFFFF', '#000000', 0.6)) >= 4.5`.

6. **Sibling-distinctness regression** (new — the central bug we're fixing):
   - dark variants: for every sibling group below, assert that at least ONE of the
     following is true for each pair within the group:
     - `Math.abs(relativeLuminance(a.bg) - relativeLuminance(b.bg)) >= 0.0015`, OR
     - the per-theme `name` field declares them in different hue families (proxy:
       compare the dominant RGB channel — if argmax differs, hue family differs).
   - Sibling groups: `[crimson-ember, rose-quartz, coral-reef]`,
     `[amber-sunset, tangerine-dream]`, `[lime-zest, chartreuse-zap]`,
     `[emerald-garden, mint-breeze, teal-lagoon]`,
     `[violet-bloom, lavender-mist, royal-purple, indigo-night]`.

7. **`primaryText` sanity** (existing rule, keep): for every theme,
   `contrastRatio(colors.primary, colors.primaryText) >= 4.5`.

If any check fails, the test message must include the offending theme ID and the actual
ratio, so designers can correct without re-running the audit script.

---

### A.1 Color Palette

Keep the existing `ThemeColors` interface and extend it with new tokens.
File: `presentation/base/theme/colors.ts`

```ts
export interface ThemeColors {
  // --- existing (keep as-is) ---
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  primary: string;
  primaryText: string;
  danger: string;
  border: string;
  chipBackground: string;
  chipText: string;

  // --- NEW tokens ---
  primaryLight: string;        // tinted background for primary-flavored surfaces
  primaryGradientStart: string;
  primaryGradientEnd: string;
  secondary: string;           // warm accent for badges, stars
  secondaryText: string;
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  cardBackground: string;
  cardBorder: string;
  inputBackground: string;
  inputBorder: string;
  inputBorderFocused: string;
  skeleton: string;            // shimmer base color
  skeletonHighlight: string;   // shimmer highlight
  shadow: string;              // for shadow color (with opacity in style)
  overlay: string;             // semi-transparent overlay on hero images
  starFilled: string;
  starEmpty: string;
  tabBarBackground: string;
  tabBarBorder: string;
  tabBarActive: string;
  tabBarInactive: string;
  avatarBackground: string;
  sectionBackground: string;   // for grouped settings rows
}
```

#### Light palette values

| Token                  | Hex         |
|------------------------|-------------|
| primaryLight           | `#E8F0FE`   |
| primaryGradientStart   | `#1A73E8`   |
| primaryGradientEnd     | `#6C63FF`   |
| secondary              | `#FF6B35`   |
| secondaryText          | `#FFFFFF`   |
| success                | `#34A853`   |
| successLight           | `#E6F4EA`   |
| warning                | `#FBBC04`   |
| warningLight           | `#FEF7E0`   |
| cardBackground         | `#FFFFFF`   |
| cardBorder             | `#F0F0F3`   |
| inputBackground        | `#F5F5F7`   |
| inputBorder            | `#E0E0E4`   |
| inputBorderFocused     | `#1A73E8`   |
| skeleton               | `#E8E8ED`   |
| skeletonHighlight      | `#F5F5F7`   |
| shadow                 | `#000000`   |
| overlay                | `rgba(0,0,0,0.35)` |
| starFilled             | `#FFB800`   |
| starEmpty              | `#D4D4D8`   |
| tabBarBackground       | `#FFFFFF`   |
| tabBarBorder           | `#F0F0F3`   |
| tabBarActive           | `#1A73E8`   |
| tabBarInactive         | `#9E9EA6`   |
| avatarBackground       | `#E8F0FE`   |
| sectionBackground      | `#F5F5F7`   |

#### Dark palette values

| Token                  | Hex         |
|------------------------|-------------|
| primaryLight           | `#1F2733`   |
| primaryGradientStart   | `#8AB4F8`   |
| primaryGradientEnd     | `#A78BFA`   |
| secondary              | `#FF8A5C`   |
| secondaryText          | `#0B0B0D`   |
| success                | `#81C995`   |
| successLight           | `#1B3326`   |
| warning                | `#FDD663`   |
| warningLight           | `#332D1A`   |
| cardBackground         | `#1C1D21`   |
| cardBorder             | `#2A2B31`   |
| inputBackground        | `#1C1D21`   |
| inputBorder            | `#2A2B31`   |
| inputBorderFocused     | `#8AB4F8`   |
| skeleton               | `#2A2B31`   |
| skeletonHighlight      | `#3A3B41`   |
| shadow                 | `#000000`   |
| overlay                | `rgba(0,0,0,0.55)` |
| starFilled             | `#FFD54F`   |
| starEmpty              | `#3A3B41`   |
| tabBarBackground       | `#0B0B0D`   |
| tabBarBorder           | `#1C1D21`   |
| tabBarActive           | `#8AB4F8`   |
| tabBarInactive         | `#6B6B70`   |
| avatarBackground       | `#1F2733`   |
| sectionBackground      | `#16171A`   |

### A.2 Typography Scale

Update `ThemedText` variants. Add new variants `headline` and `label`.

File: `presentation/base/widgets/themed-text.tsx`

```ts
export type ThemedTextVariant =
  | 'headline'   // NEW - large hero text
  | 'title'
  | 'subtitle'
  | 'body'
  | 'label'      // NEW - form labels, section headers
  | 'caption';

// Updated style values:
const styles = StyleSheet.create<Record<ThemedTextVariant, TextStyle>>({
  headline: {
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 26,
  },
  body: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 22,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  caption: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
  },
});
```

### A.3 Spacing & Sizing Tokens

Add new tokens to `presentation/base/theme/spacing.ts`:

```ts
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,   // NEW - hero section padding
} as const;

export const radii = {
  xs: 4,      // NEW - small chips
  sm: 6,
  md: 8,
  lg: 12,     // CHANGED from 10 to 12
  xl: 16,
  xxl: 24,    // NEW - card corners
  round: 9999,
} as const;

export const fontSizes = {
  caption: 13,     // CHANGED from 12 to 13 for better readability
  label: 13,       // NEW
  body: 15,        // CHANGED from 16 to 15
  subtitle: 18,
  title: 24,       // CHANGED from 28
  headline: 32,    // NEW
} as const;

// NEW - Standard sizing for common elements
export const sizes = {
  iconSm: 16,
  iconMd: 20,
  iconLg: 24,
  iconXl: 32,
  avatarSm: 40,
  avatarMd: 56,
  avatarLg: 80,
  buttonHeight: 52,
  inputHeight: 52,
  cardImageHeight: 180,
  heroImageHeight: 280,
  tabBarHeight: 56,
  settingsRowHeight: 52,
  searchBarHeight: 44,
  progressBarHeight: 6,
  checkboxSize: 24,
} as const;
```

### A.4 Card Styles

Create a new file: `presentation/base/theme/shadows.ts`

```ts
import { Platform, type ViewStyle } from 'react-native';

export const shadows = {
  sm: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
    },
    android: {
      elevation: 2,
    },
    default: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
    },
  }) ?? {},

  md: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
    },
    android: {
      elevation: 4,
    },
    default: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
    },
  }) ?? {},

  lg: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.16,
      shadowRadius: 24,
    },
    android: {
      elevation: 8,
    },
    default: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.16,
      shadowRadius: 24,
    },
  }) ?? {},
} as const;
```

Export from `presentation/base/theme/index.ts`:
```ts
export { shadows } from './shadows';
```

### A.5 Animation & Transition Guidelines

| Interaction         | Animation                                           | Duration | Library                    |
|---------------------|-----------------------------------------------------|----------|----------------------------|
| Card press          | Scale down to 0.97 + opacity 0.9                    | 100ms    | `react-native-reanimated`  |
| Card release        | Scale back to 1.0 + opacity 1.0                     | 150ms    | `react-native-reanimated`  |
| Screen enter        | Fade in from opacity 0 to 1                         | 250ms    | `react-native-reanimated`  |
| Skeleton shimmer    | Translate highlight band left-to-right, infinite     | 1200ms   | `react-native-reanimated`  |
| Checkbox toggle     | Scale bounce 1.0 -> 1.15 -> 1.0 + checkmark draw    | 300ms    | `react-native-reanimated`  |
| Pull-to-refresh     | Use default `RefreshControl` (already in place)      | native   | React Native built-in      |
| Button press        | Opacity 0.85 (already in PrimaryButton)              | native   | Pressable built-in         |
| List item appear    | FadeInDown stagger, 50ms between items               | 300ms    | `react-native-reanimated`  |

Implementation note: Wrap animated cards in `Animated.View` from `react-native-reanimated` (already a dependency). Use `useAnimatedStyle`, `withTiming`, `withSpring` hooks. Do NOT add `react-native-animatable` or `lottie` -- keep the dependency tree minimal.

---

## B. Screen-by-Screen Redesign Specs

### B.1 Login Screen

**File:** `presentation/screens/login/login-screen.tsx`

**Layout (top to bottom):**

1. **Gradient background area** (top 40% of screen)
   - Use `expo-linear-gradient` (`expo install expo-linear-gradient`)
   - Colors: `primaryGradientStart` -> `primaryGradientEnd` (diagonal, start={x:0,y:0} end={x:1,y:1})
   - Position: absolute, top 0, left 0, right 0, height 40% of screen
   - borderBottomLeftRadius: 32, borderBottomRightRadius: 32

2. **App logo / icon area** (centered in gradient area)
   - Large app name text: "Recipely" using `headline` variant, color `#FFFFFF`
   - Below it: fork-and-knife icon from `@expo/vector-icons/MaterialCommunityIcons` name="silverware-fork-knife", size 48, color `#FFFFFF`
   - Below icon: subtitle text using `body` variant, color `rgba(255,255,255,0.8)`

3. **Card form** (overlapping the gradient bottom edge)
   - `cardBackground` with `borderRadius: radii.xxl (24)`
   - shadow: `shadows.lg`
   - padding: `spacing.xl (24)` all sides
   - marginHorizontal: `spacing.lg (16)`
   - marginTop: -40 (negative to overlap gradient)

4. **Input fields** (inside card)
   - Height: `sizes.inputHeight (52)`
   - backgroundColor: `inputBackground`
   - borderWidth: 1.5
   - borderColor: `inputBorder`, on focus: `inputBorderFocused`
   - borderRadius: `radii.lg (12)`
   - paddingLeft: 48 (to accommodate icon)
   - Icon (inside input, position absolute left 16):
     - Username: `MaterialCommunityIcons` name="account-outline" size=20 color=`textMuted`
     - Password: `MaterialCommunityIcons` name="lock-outline" size=20 color=`textMuted`
   - fontSize: 15
   - gap between inputs: `spacing.md (12)`

5. **Error message** (below inputs if present)
   - color: `danger`
   - fontSize: caption
   - marginTop: `spacing.sm (8)`

6. **Sign in button**
   - Full width inside the card
   - Height: `sizes.buttonHeight (52)`
   - borderRadius: `radii.lg (12)`
   - backgroundColor: `primary`
   - When loading: show `ActivityIndicator` centered, white
   - When disabled (fields empty): opacity 0.5
   - marginTop: `spacing.lg (16)`

7. **Hint text** (below card)
   - variant: `caption`, muted
   - marginTop: `spacing.lg (16)`
   - textAlign: center

**Behavioral notes:**
- Use `KeyboardAvoidingView` with `behavior="padding"` on iOS
- Wrap in `ScrollView` with `keyboardShouldPersistTaps="handled"`
- Track input focus state with `useState<'username' | 'password' | null>(null)` for border color changes

### B.2 Recipe List Screen

**File:** `presentation/screens/recipes/recipe-list-screen.tsx`

**Layout:**

1. **Search bar** (sticky at top)
   - Component: `<SearchBar>` (new widget, see section C)
   - height: `sizes.searchBarHeight (44)`
   - marginHorizontal: `spacing.lg (16)`
   - marginTop: `spacing.sm (8)`
   - marginBottom: `spacing.md (12)`
   - backgroundColor: `inputBackground`
   - borderRadius: `radii.round (9999)`
   - Left icon: `Ionicons` name="search" size=18 color=`textMuted`
   - Right icon (when text present): `Ionicons` name="close-circle" size=18, clearable
   - placeholder: "Search recipes..." (new i18n key)
   - Filter locally on `state.recipes` by `item.name` (case-insensitive includes)
   - Place as `ListHeaderComponent` in `FlatList`

2. **Recipe cards** (vertical list, card layout)
   - Component: `<RecipeCard>` (new widget, see section C)
   - FlatList with `contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl }}`
   - `ItemSeparatorComponent`: `View` with `height: spacing.md (12)`
   - Each card layout:
     - Container: `cardBackground`, `borderRadius: radii.xl (16)`, `shadows.md`, overflow hidden
     - **Image area**: height `sizes.cardImageHeight (180)`, width 100%, `resizeMode="cover"`
       - Use `expo-image` `Image` component (already a dependency) for better caching
       - Bottom gradient overlay: 60px tall, from transparent to `rgba(0,0,0,0.5)`, position absolute bottom
       - **Cuisine badge**: position absolute top-right (top: 12, right: 12)
         - backgroundColor: `primary`, borderRadius: `radii.round`
         - paddingHorizontal: 10, paddingVertical: 4
         - text: `caption` variant, color: `primaryText`, fontWeight 600
       - **Difficulty chip**: position absolute top-left (top: 12, left: 12)
         - backgroundColor: `rgba(0,0,0,0.55)`, borderRadius: `radii.round`
         - paddingHorizontal: 10, paddingVertical: 4
         - text: `caption` variant, color: `#FFFFFF`
     - **Info area**: padding `spacing.md (12)` horizontal, `spacing.md (12)` vertical
       - **Recipe name**: `subtitle` variant, numberOfLines=1
       - **Bottom row** (flexDirection: row, justifyContent: space-between, alignItems: center, marginTop: spacing.xs):
         - Left: tags (first 2 only), each as small pill:
           - backgroundColor: `chipBackground`, borderRadius: `radii.round`
           - paddingHorizontal: 8, paddingVertical: 2
           - text: `caption` variant, color: `chipText`
         - Right: star rating row
           - 5 star icons, `MaterialCommunityIcons` name="star" / "star-half-full" / "star-outline"
           - size: 14, filled color: `starFilled`, empty color: `starEmpty`
           - Text: `caption` variant, muted, `(item.rating.toFixed(1))`

3. **Loading state** (skeleton placeholders instead of spinner)
   - Component: `<SkeletonLoader>` (new widget, see section C)
   - Show 3 skeleton cards in a `ScrollView`
   - Each skeleton card matches the RecipeCard dimensions:
     - Image area: `sizes.cardImageHeight (180)` tall rectangle, `skeleton` color
     - Title line: 60% width, 18px height, `skeleton` color
     - Bottom row: two small rectangles (tags) + one rectangle (rating)
   - Shimmer animation on each skeleton block

4. **Empty state**
   - Centered message using existing `StateView`
   - Add an icon above text: `MaterialCommunityIcons` name="food-off" size=64 color=`textMuted`

5. **Pull-to-refresh**: keep existing `RefreshControl`

6. **Press interaction on card**:
   - Animated scale: `withTiming(0.97, { duration: 100 })` on press in
   - Animated scale: `withTiming(1.0, { duration: 150 })` on press out

### B.3 Recipe Detail Screen

**File:** `presentation/screens/recipes/recipe-detail-screen.tsx`

**Layout:**

1. **Hero image** (full-width, no horizontal padding)
   - height: `sizes.heroImageHeight (280)`
   - width: 100%
   - resizeMode: cover
   - Use `expo-image` `Image`
   - Gradient overlay at bottom: 100px, from transparent to `background` color
   - Gradient overlay at top: 80px, from `rgba(0,0,0,0.4)` to transparent (for back button legibility)

2. **Floating back button** (position absolute, top: safeAreaInsets.top + 8, left: 16)
   - width: 40, height: 40, borderRadius: 20 (circle)
   - backgroundColor: `rgba(0,0,0,0.4)`
   - Icon: `Ionicons` name="chevron-back" size=24 color="#FFFFFF"
   - onPress: `router.back()`
   - Use `useSafeAreaInsets()` from `react-native-safe-area-context` for top offset
   - Set `headerShown: false` for this screen in the Stack.Screen options

3. **Content area** (below hero, paddingHorizontal: spacing.lg, marginTop: -spacing.xxl to overlap image)
   - **Recipe name**: `title` variant
   - **Info chips row** (flexDirection: row, flexWrap: wrap, gap: spacing.sm, marginTop: spacing.md)
     - Component: `<InfoChip>` (inline, not a separate file)
     - Each chip: backgroundColor `chipBackground`, borderRadius `radii.round`, paddingHorizontal 12, paddingVertical 6
     - Icon + text in each chip:
       - Cuisine: `MaterialCommunityIcons` name="earth" size=14 + cuisine text
       - Difficulty: `MaterialCommunityIcons` name="signal-cellular-outline" (or "speedometer") size=14 + difficulty text
       - Prep time: `MaterialCommunityIcons` name="clock-outline" size=14 + `{prepTimeMinutes} min`
       - Cook time: `MaterialCommunityIcons` name="fire" size=14 + `{cookTimeMinutes} min`
       - Rating: `MaterialCommunityIcons` name="star" size=14 color=`starFilled` + `{rating.toFixed(1)}`
     - Chip text: `caption` variant, color `chipText`

4. **Tags row** (if tags.length > 0, marginTop: spacing.md)
   - Same style as current but use `chipBackground` and `chipText` colors properly

5. **Ingredients section** (marginTop: spacing.xl)
   - Section header: `<SectionHeader>` component (new widget)
     - `label` variant text, uppercase, color `textMuted`
     - Horizontal line after text (flex: 1, height: 1, backgroundColor: border, marginLeft: spacing.md)
   - Each ingredient as `<CheckboxItem>` (new widget, see section C)
     - Visual-only checkbox (no state persistence needed, local `useState` array)
     - Unchecked: 24x24 rounded square, borderWidth: 2, borderColor: `border`, borderRadius: radii.sm
     - Checked: backgroundColor: `success`, checkmark icon `Ionicons` name="checkmark" size=16 color="#FFFFFF"
     - Text: `body` variant, marginLeft: spacing.md
     - When checked: text gets `textDecorationLine: 'line-through'`, color `textMuted`
     - Row: flexDirection: row, alignItems: center, paddingVertical: spacing.sm

6. **Instructions section** (marginTop: spacing.xl)
   - Section header: same `<SectionHeader>`
   - Each step as a numbered card:
     - flexDirection: row, alignItems: flex-start, marginTop: spacing.md
     - **Step number circle**: width 28, height 28, borderRadius 14, backgroundColor `primary`, centered text `primaryText` fontWeight 700 fontSize 13
     - **Step text**: `body` variant, flex 1, marginLeft: spacing.md, lineHeight 22

7. **View Tasks button** (marginTop: spacing.xxl, marginBottom: spacing.xxl)
   - Use existing `<PrimaryButton>`

8. **Loading state**: Use `<SkeletonLoader>` with layout matching hero + text blocks

### B.6 Settings/Profile Screen (NEW)

**New files needed:**
- `presentation/screens/settings/settings-screen.tsx`
- `presentation/app/settings.tsx` (route file)

**Data source:** `authStore` state -- when `status === 'authenticated'`, read `session.user` for displayName, email, photoUrl.

**Layout:**

1. **User info section** (top)
   - Container: alignItems: center, paddingVertical: spacing.xxl
   - **Avatar**: `<AvatarImage>` component (new widget)
     - size: `sizes.avatarLg (80)`
     - borderRadius: 40 (circular)
     - If `photoUrl` exists: show Image with source `{ uri: photoUrl }`
     - If no photoUrl: show initials (first letter of displayName) on `avatarBackground`, text color `primary`, fontSize 28, fontWeight 700
   - **Display name**: `title` variant, marginTop: spacing.md
   - **Email**: `body` variant, muted, marginTop: spacing.xs

2. **Settings sections** (grouped rows)
   - **Appearance section**
     - Section header: `<SectionHeader>` with label text "Appearance" / "Gorunum" (i18n)
     - `<ThemeToggle>` row (new widget):
       - `<SettingsRow>` with icon `Ionicons` name="color-palette-outline"
       - Label: "Theme" / "Tema"
       - Right side: segmented control or cycling button with values: System / Light / Dark
       - Values stored in a new Zustand store: `presentation/stores/preferences-store.ts`
       - This store wraps `useColorScheme` override (using `expo-system-ui` `setBackgroundColorAsync` and React context)
     - `<LanguageSelector>` row (new widget):
       - `<SettingsRow>` with icon `Ionicons` name="language-outline"
       - Label: "Language" / "Dil"
       - Right side: "English" / "Turkce" cycling button or modal picker

   - **Account section**
     - Section header: "Account" / "Hesap"
     - Sign out row:
       - `<SettingsRow>` with icon `Ionicons` name="log-out-outline"
       - Label: "Sign out" / "Cikis yap"
       - Text color: `danger`
       - onPress: call `authStore.signOut()`, then `router.replace('/login')`

   - **About section**
     - Section header: "About" / "Hakkinda"
     - Version row:
       - `<SettingsRow>` with icon `Ionicons` name="information-circle-outline"
       - Label: "Version" / "Surum"
       - Right text: "1.0.0" (read from `expo-constants` `Constants.expoConfig?.version`)
     - Non-pressable, no chevron

3. **`<SettingsRow>` layout** (reusable, see section C)
   - height: `sizes.settingsRowHeight (52)`
   - flexDirection: row, alignItems: center
   - paddingHorizontal: spacing.lg
   - backgroundColor: `cardBackground`
   - Left icon: size 22, color `primary` (or `danger` for destructive)
   - Label: `body` variant, flex: 1, marginLeft: spacing.md
   - Right content: custom (text, chevron icon, toggle)
   - Pressable rows show chevron: `Ionicons` name="chevron-forward" size=18 color=`textMuted`
   - Group rows in a container with borderRadius: radii.lg, overflow: hidden, marginHorizontal: spacing.lg
   - Separator between rows: height: StyleSheet.hairlineWidth, backgroundColor: `border`, marginLeft: 54

### Portion stepper and unit toggle (recipe detail)

TODO(design): portion stepper to be redesigned in Claude Design. Claude Design was unavailable when
it shipped; the owner approved building it from existing widgets. Today: the servings stat tile
(mobile meta card) carries a `− +` row of `RoundIconButton`s (`controlSizes.touchTarget`, as the
diary's servings stepper) under its value; the web sidebar's Servings row shows `− n +`. The
Original / Metric / US toggle above the ingredient list reuses `SegmentedTabs`.

## C. New Components Needed

All new components live in `presentation/base/widgets/`.

### C.1 RecipeCard

**File:** `presentation/base/widgets/recipe-card.tsx`

```ts
export interface RecipeCardProps {
  name: string;
  image: string;
  cuisine: string;
  difficulty: string;
  rating: number;
  tags: string[];
  onPress: () => void;
}
```

- Max 120 lines.
- Uses `expo-image` `Image` for the recipe image.
- Uses `Animated.View` from `react-native-reanimated` for press scale animation.
- Uses `@expo/vector-icons/MaterialCommunityIcons` for star icons.
- Layout described in B.2 above.

### C.2 SearchBar

**File:** `presentation/base/widgets/search-bar.tsx`

```ts
export interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
}
```

- Height: `sizes.searchBarHeight (44)`
- backgroundColor: `inputBackground`
- borderRadius: `radii.round`
- Left search icon, right clear button (when value.length > 0)
- TextInput with no border, transparent background

### C.3 SkeletonLoader

**File:** `presentation/base/widgets/skeleton-loader.tsx`

```ts
export interface SkeletonLoaderProps {
  width: number | `${number}%`;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}
```

- Uses `react-native-reanimated` for shimmer animation.
- Base color: `skeleton`, highlight color: `skeletonHighlight`.
- Animated translateX of a highlight overlay, looping every 1200ms.

### C.4 CheckboxItem

**File:** `presentation/base/widgets/checkbox-item.tsx`

```ts
export interface CheckboxItemProps {
  label: string;
  checked: boolean;
  onToggle?: () => void;
  disabled?: boolean;
}
```

- Pressable row with checkbox visual + text.
- Checkbox size: `sizes.checkboxSize (24)`.
- Animated scale bounce on toggle via `react-native-reanimated`.

### C.5 ProgressBar

**File:** `presentation/base/widgets/progress-bar.tsx`

```ts
export interface ProgressBarProps {
  current: number;
  total: number;
  label?: string;  // e.g., "3 of 5 completed"
}
```

- Track: full width, height `sizes.progressBarHeight (6)`, backgroundColor `border`, borderRadius round.
- Fill: animated width transition, backgroundColor `success`.

### C.6 SettingsRow

**File:** `presentation/base/widgets/settings-row.tsx`

```ts
export interface SettingsRowProps {
  icon: string;             // Ionicons icon name
  label: string;
  rightElement?: ReactNode; // custom right-side content
  onPress?: () => void;
  destructive?: boolean;    // makes icon + text use danger color
  showChevron?: boolean;    // default true when onPress is provided
}
```

- Height: `sizes.settingsRowHeight (52)`.
- Pressable wrapper with opacity press feedback.

### C.7 AvatarImage

**File:** `presentation/base/widgets/avatar-image.tsx`

```ts
export interface AvatarImageProps {
  uri?: string;
  name: string;        // fallback: show initials
  size: number;
}
```

- Circular image or initials fallback.
- backgroundColor for fallback: `avatarBackground`.

### C.8 SectionHeader

**File:** `presentation/base/widgets/section-header.tsx`

```ts
export interface SectionHeaderProps {
  title: string;
}
```

- Uses `label` variant text (uppercase, muted).
- Horizontal line to the right of the text.
- marginTop: `spacing.xl`, marginBottom: `spacing.md`.
- paddingHorizontal: `spacing.lg`.

### C.9 ThemeToggle

**File:** `presentation/base/widgets/theme-toggle.tsx`

```ts
export interface ThemeToggleProps {
  value: 'system' | 'light' | 'dark';
  onChange: (value: 'system' | 'light' | 'dark') => void;
}
```

- Three-segment button row.
- Active segment: backgroundColor `primary`, text `primaryText`.
- Inactive segments: backgroundColor `inputBackground`, text `textMuted`.
- borderRadius: `radii.round`.
- Height: 34.

### C.10 LanguageSelector

**File:** `presentation/base/widgets/language-selector.tsx`

```ts
export interface LanguageSelectorProps {
  value: 'en' | 'tr';
  onChange: (value: 'en' | 'tr') => void;
}
```

- Two-segment button: "EN" / "TR".
- Same visual style as ThemeToggle segments.

---

## Mobile Home — Collapsing Header & Filter FAB (June 2026)

A mobile-only, scroll-driven redesign of `RecipeListScreen` that reclaims the recipe list's
vertical space. Today the list gets ~40% of the viewport because six bands of chrome are
permanently fixed above it. This redesign demotes most of that chrome into the scroll content
(so it scrolls away) and collapses the rest, while moving filter + sort into a single morphing
FAB. **Web shell is explicitly out of scope — see "Web shell" below.**

### Problem (current state)

On mobile, above the `FlatList`, this is all permanently fixed (never scrolls):

1. `RecipesAppHeader` — "Recipely" eyebrow + large screen title + notifications bell.
2. `SearchBar`.
3. Pill row — Filter pill, Sort pill, inline result count.
4. Active-filter chips row (only when filters applied).
5. `AiBannerCard` — gradient AI promo.
6. `CuisineStrip` — title + horizontal cuisine circles.

Plus the bottom `TabBar`. The list is squeezed into what's left.

### Design goals

- The list owns the screen. At rest, only a slim header band + search sit above it; everything
  else lives inside the scroll content and moves away as the user reads.
- One persistent, reachable control for filter/sort — a FAB — instead of a fixed pill row.
- Direction-aware header: hide on scroll-down (reading), reveal on scroll-up (seeking controls).
- Every animation runs on the UI thread (Reanimated worklets driven by a shared scroll offset).

### References

- **[Material 3 — Top app bar scroll behavior](https://m3.material.io/components/top-app-bar/guidelines)** —
  "small top app bar" `enterAlways`/`exitUntilCollapsed` behavior: the bar translates fully
  off-screen on downward scroll and snaps back on any upward scroll. We adopt the direction-aware
  hide/reveal and the "snap to fully shown / fully hidden" resolution.
- **[Material 3 — FAB & Extended FAB](https://m3.material.io/components/floating-action-button/guidelines)** —
  the extended-FAB → FAB shrink-on-scroll pattern (label collapses to icon while scrolling, the
  badge persists). We adopt the morph and the bottom-end placement above the nav bar.
- **[Apple HIG — Large titles / iOS Search](https://developer.apple.com/design/human-interface-guidelines/searching)** —
  the large-title-collapses-to-inline pattern and search bar that recedes under the title on scroll.
  We borrow the title shrink + fade, not a navigation-controller large title.
- **Mobbin — Yummly / Tasty home feeds** — cuisine strip and promo banner are part of the *feed*,
  not fixed chrome; they scroll away and the grid takes over. We move `AiBannerCard` + `CuisineStrip`
  into `ListHeaderComponent`.

### Layout — what scrolls, what collapses, what becomes a FAB

| Element (current) | New behavior | Where it lives |
|---|---|---|
| `RecipesAppHeader` (eyebrow + title + bell) | **Collapses** — title shrinks `title`→`subtitle` and the eyebrow fades out as it shrinks; the whole band **hides on scroll-down / reveals on scroll-up**. Bell stays tappable whenever the band is shown. | Fixed (animated `Animated.View`), above the list |
| `SearchBar` | **Collapses with the header band** (translates up with it, fades its last ~30%). Part of the same hide/reveal group. | Fixed (same animated band) |
| Filter pill + Sort pill + result count | **Removed from fixed chrome.** Filter+Sort become the **FAB**. Result count moves into the scrolling `ListHeaderComponent` (small muted caption row). | FAB (fixed) + scroll content |
| Active-filter chips row | **Moves into `ListHeaderComponent`** so it scrolls away; still removable; "Clear all" stays at the row end. | Scroll content |
| `AiBannerCard` | **Moves into `ListHeaderComponent`** — scrolls away with the feed. | Scroll content |
| `CuisineStrip` | **Moves into `ListHeaderComponent`** — scrolls away with the feed. | Scroll content |
| Recipe `FlatList` | Becomes the single scroll surface; gains top padding equal to the resting header height so row 1 isn't hidden under the band. | The scroll view |
| `TabBar` | Unchanged, fixed at bottom. | Fixed |

Net effect at rest: only the collapsing header band (≈ `sizes.homeHeaderMax`) sits above a
full-height list. After a short scroll the band is gone entirely and the list is full-bleed.

### Collapsing header band — geometry & animation

The band is one fixed `Animated.View` containing the title row (eyebrow + title + bell) and the
`SearchBar`. It is driven by a single `scrollY` shared value from the list's
`onScroll` (`useAnimatedScrollHandler`, `scrollEventThrottle={16}`).

**New tokens required** (add to `spacing.ts` `sizes`; values chosen so the band matches the
current resting layout):

| Token | Value | Meaning |
|---|---|---|
| `sizes.homeHeaderMax` | `132` | Resting band height (title row ≈ 56 + search 44 + vertical padding ≈ 32). |
| `sizes.homeHeaderMin` | `0` | Fully collapsed height — band translates entirely off-screen. |
| `sizes.homeTitleShrink` | `96` | Scroll distance (px) over which the title shrinks + eyebrow fades, before hide/reveal takes over. |
| `sizes.fab` | `56` | FAB diameter (Material standard 56). |
| `sizes.fabExtendedHeight` | `48` | Height of the extended (label-visible) FAB pill. |

Two independent behaviors compose on the band:

**1. Title collapse (absolute, tied to scrollY position):**

- `titleScale = interpolate(scrollY, [0, homeTitleShrink], [1, 0.82], CLAMP)` applied to the
  title text (visually morphs `title` 24pt → ~`subtitle` 20pt).
- `eyebrowOpacity = interpolate(scrollY, [0, homeTitleShrink * 0.5], [1, 0], CLAMP)` — the
  "Recipely" eyebrow fades out first.
- `searchOpacity = interpolate(scrollY, [homeTitleShrink * 0.5, homeTitleShrink], [1, 0.55], CLAMP)`
  — search dims slightly as the band tightens (stays visible until the band hides).

**2. Direction-aware hide/reveal (relative, tied to scroll direction):**

Track `lastScrollY` and `headerTranslateY` (a shared value, range `[-homeHeaderMax, 0]`).

- On scroll **down** past `sizes.homeHeaderMax` of total offset: drive `headerTranslateY` toward
  `-homeHeaderMax` (band slides up out of view).
- On scroll **up** by more than `spacing.sm` (8px) cumulative: drive `headerTranslateY` toward `0`.
- At `scrollY <= sizes.homeHeaderMax`: force `headerTranslateY = 0` (always show the band near the top).
- Apply with `withTiming(target, { duration: 220, easing: Easing.out(Easing.cubic) })`. The band's
  `Animated.View` style is `{ transform: [{ translateY: headerTranslateY }] }`.
- The list's `contentContainerStyle.paddingTop = sizes.homeHeaderMax` so content starts below the
  resting band; the band overlaps via absolute positioning (`position:'absolute', top:0, zIndex:20`).

**Snap resolution** (Material small-top-app-bar feel): on scroll-end (`onMomentumScrollEnd` /
`onScrollEndDrag`), if `headerTranslateY` is between 0 and `-homeHeaderMax`, snap to whichever edge
is nearer with the same 220ms timing. Never leave the band half-shown.

### Filter / Sort FAB — placement, morph, badge

A single FAB replaces the fixed Filter + Sort pills. Tapping it opens the existing filter
`BottomSheet`. Sort is reachable from the same sheet via a segmented "Sort" control at the top of
the filter sheet (so one FAB covers both) — see "Sort inside the filter sheet" below.

**Placement:**

- `position: 'absolute'`, bottom-end. `right: spacing.lg`.
- `bottom = sizes.tabBarHeight + insets.bottom + spacing.lg` (floats clear above the `TabBar`).
- `zIndex: 30` (above list, below `BottomSheet` modal).

**Resting (extended) vs scrolled (compact) morph:**

- At rest and within the first screenful (`scrollY <= sizes.homeHeaderMax`), the FAB is an
  **extended FAB**: height `sizes.fabExtendedHeight`, rounded `radii.round`, shows a funnel icon
  + label (`t().recipes.filtersAndSort`, new key) + the active-count badge.
- On scroll-down the FAB **shrinks to a circular icon FAB** (`sizes.fab` diameter): the label
  width animates to 0 and fades (`labelOpacity = interpolate(scrollY, [homeHeaderMax, homeHeaderMax + 64], [1, 0], CLAMP)`),
  the container width animates from extended → `sizes.fab` with `withTiming(220)`. The funnel icon
  and badge persist. On scroll-up back near the top it re-extends.
- The FAB itself never hides — only morphs — so filter access is always one tap away.

**FAB visual tokens:**

| Element | Token | Notes |
|---|---|---|
| FAB fill | `colors.primary` | |
| FAB icon (`funnel-outline`) + label | `colors.primaryText` | Contracted text-on-primary; verified ≥7.0:1 in all 20 themes (existing audit, section D). |
| FAB elevation | `shadows.lg` (iOS) / `elevation` (Android) | On very dark themes the shadow is weak, so also draw a 1px `colors.gradientBorder` hairline ring so the FAB reads against `colors.background`. |
| Active-count badge bg | `colors.gradientBorder` | Mirrors the existing in-app filter `pillBadge` (the pill row's count badge today). Reads as a light chip on the `colors.primary` FAB fill in every theme. |
| Active-count badge text | `colors.primaryText` | Contracted text-on-primary; same pair the existing `pillBadge` uses for its count, so it carries the app-wide ≥AA guarantee for the numeric label. |
| Badge border | `colors.background` | 2px ring so the badge separates from the FAB fill, mirroring `RecipesAppHeader`'s bell badge. |

> **Badge contrast note:** do **not** use `colors.danger` + white here (as the bell badge does). `danger`/white is only ~2.4:1 on the dark-variant `danger` (`#F28B82`) and fails AA for the small numeric text. Reusing the `pillBadge` pair (`gradientBorder` fill / `primaryText` text) keeps the count legible on the FAB across all 20 themes without introducing a new token. The badge is a count, not a status, so the red affordance isn't needed.

**Badge:** show only when `activeFilterCount > 0`; text is the count (`9+` if `>9`), positioned
top-end of the FAB like the bell badge in `RecipesAppHeader` but using the `pillBadge` colors above.

### Sort inside the filter sheet

Because the FAB now owns both filter and sort, add a compact **Sort** selector as the first
section of the filter `BottomSheet` (above Cuisine), reusing the existing sort options. This keeps
one entry point. The standalone sort `BottomSheet` (`sheetOpen === 'sort'`) is removed from the
mobile flow. Implementation: render the sort options as a horizontal `SelectChip` row at the top of
the filter sheet; selecting one updates `sortBy` and is applied together with "Show results".

### Scroll content order (FlatList `ListHeaderComponent`)

Top → down, all inside the scrolling list header (so all of it scrolls away):

1. `AiBannerCard` (`marginBottom: spacing.md`).
2. `CuisineStrip`.
3. Result-count + Clear-all row (`spacing.lg` horizontal, `spacing.sm` vertical) — the muted
   "{count} {results}" caption left, "Clear all" link right when `activeFilterCount > 0`.
4. Active-filter chips row (only when `nonCuisineFilterCount > 0`) — the existing horizontal chip
   scroller, unchanged styling.

Then the recipe rows follow. `ItemSeparatorComponent` and row styling are unchanged.

### ASCII wireframe

```
RESTING (scrollY = 0)                  SCROLLED DOWN (reading)
┌──────────────────────────┐           ┌──────────────────────────┐
│ Recipely            (🔔) │ ← band    │  (band slid up, gone)    │
│ Recipes                  │  collapses │                          │
│ ┌──────────────────────┐ │  + hides   │  ████ recipe card        │
│ │ 🔍  Search recipes   │ │            │  ████ recipe card        │
│ └──────────────────────┘ │            │  ████ recipe card        │
├──────────────────────────┤ ← list top │  ████ recipe card        │
│ ✨ Generate with AI    › │  (scrolls) │  ████ recipe card        │
│ Browse cuisines          │            │  ████ recipe card        │
│ 🥙 🍕 🌮 🍣 🍛 …          │            │              ┌─────┐     │
│ 24 recipes               │            │              │  ▽  │ ←FAB│
│ ████ recipe card         │            │              └─────┘ (3) │
│ ████ recipe card    ┌───────────┐     │                          │
│ ████ recipe card    │ ▽ Filter&│ ←FAB │                          │
│ ████ recipe card    │   Sort (3)│     │                          │
│                     └───────────┘     │                          │
├──────────────────────────┤           ├──────────────────────────┤
│  🍴      🔖      👤      │ TabBar    │  🍴      🔖      👤      │
└──────────────────────────┘           └──────────────────────────┘
   extended FAB                            compact FAB (label gone)
```

### States

- **Loading / error / empty:** unchanged from current screen, but the loading skeleton and
  empty/error views render *below* the collapsing band (same `paddingTop: sizes.homeHeaderMax`).
  The FAB is hidden while `state.status !== 'loaded'` (nothing to filter yet); it fades in
  (`withTiming(150)`) when results arrive.
- **Pressed (FAB):** `Pressable` `pressed` → opacity 0.85 (no custom scale needed).
- **No active filters:** FAB shows no badge; label reads `t().recipes.filtersAndSort`.
- **Reduced motion:** if `AccessibilityInfo.isReduceMotionEnabled()` is true, skip the translate
  animations — keep the band always shown and the FAB always extended (no morph). Document this
  branch; implement with the existing reduce-motion check pattern if present, else a `useState`
  populated from `AccessibilityInfo`.

### Accessibility

- FAB: `accessibilityRole="button"`, `accessibilityLabel={t().recipes.filtersAndSort}`. When a
  count is active, append it: `` `${t().recipes.filtersAndSort}, ${activeFilterCount}` `` (mirrors
  the bell's labeling). Tap target is `sizes.fab` (56) — exceeds the 44pt minimum even when compact.
- Bell stays `accessibilityRole="button"` with its existing label; it remains reachable whenever the
  band is shown. When the band is hidden by scroll, scrolling up reveals it — acceptable since the
  band auto-shows near the top and on any upward scroll.
- The collapsing band must not trap focus; the title shrink is decorative (no role change).
- Contrast pairs verified: FAB `primary`/`primaryText` (contracted text-on-primary, app-wide
  guarantee — see section D); badge reuses the existing `pillBadge` pair (`gradientBorder` /
  `primaryText`), so no new pairing is introduced; band text on `background` unchanged from today.
  Note: `danger`/white is deliberately **avoided** for the badge — it measures ~2.4:1 on the
  dark-variant `danger` and would fail AA for the numeric text.

### i18n

One new user-visible string. Add to **both** `en.ts` and `tr.ts` under `recipes`:

| Key | en | tr |
|---|---|---|
| `recipes.filtersAndSort` | `Filter & Sort` | `Filtrele ve Sırala` |

All other strings reuse existing keys (`recipes.filter`, `recipes.sortBy`, `recipes.results`,
`recipes.clearFilters`, `recipes.browseCuisines`, sort labels). The standalone `recipes.filter`
key is still used as the bottom-sheet title.

### Web shell — explicitly untouched

This entire section applies **only** when `isWebShell === false`. The web shell keeps its current
layout verbatim: no collapsing band, no FAB, no header morph. In code, the new `Animated` band, the
FAB, and the scroll handler must be gated behind `!isWebShell` (the web path continues to render the
existing sticky header + `WebShellState` search and the standard `FlatList`/grid). Do not move
`AiBannerCard`/`CuisineStrip` into the list header on web — the web shell already positions them and
the grid differently. `gridColumns > 1` (web grid) is unaffected.

### Tokens used

| Element | Token | Notes |
|---|---|---|
| Band bg | `colors.background` | |
| Band bottom hairline | `colors.border` | `StyleSheet.hairlineWidth`, only when band shown |
| Title / eyebrow | `colors.text` / `colors.textMuted` | unchanged from `RecipesAppHeader` |
| Search field | `colors.inputBackground`, `colors.text` | unchanged `SearchBar` |
| FAB fill | `colors.primary` | |
| FAB icon + label | `colors.primaryText` | |
| FAB ring (dark-safe) | `colors.gradientBorder` | 1px, replaces invisible shadow on dark themes |
| FAB badge bg / text | `colors.gradientBorder` / `colors.primaryText` | reuses existing `pillBadge` pair; `danger`/white avoided (fails AA, ~2.4:1 dark) |
| FAB badge ring | `colors.background` | 2px |
| Result count caption | `colors.textMuted` | |

No new color tokens are required — all FAB/badge/band colors are existing theme tokens. Only the
five `sizes.*` layout tokens above are new.

## Recipe detail — Author card (Jun 2026)

An info-only "who created this recipe" block on the recipe detail screen. **No follow button, no
follower count, no navigation on tap** — it identifies the author and nothing more. For a recipe the
signed-in user owns, it self-identifies them with a "You" pill instead of any action.

> Final design intent confirmed in the Claude Design handoff (chat19). The prototype's follow button,
> follower count, and verified shield badge are all **dropped** — the backend has no follow graph and no
> verified field. Real data exposes `displayName`, `photoUrl`, and `recipeCount` only; there is **no
> `@username`**, so the caption drops the handle and keeps only the recipe count.

### Source

- Prototype: `project/src/social.jsx` `RecipeAuthorCard` (lines ~34–82); placed in
  `project/src/screens.jsx` line ~2056, directly below the stats strip and above `RecipeMetaCard`.

### Placement in the live screen

`presentation/screens/recipes/recipe-detail-screen.tsx`. The card renders inside the loaded body, in
the content column **after the chips/time/nutrition meta and before the `Ingredients` SectionHeader**
(`recipe-detail-screen.tsx` ~line 372, where `SectionHeader title={t().recipes.ingredients}` begins).
The prototype puts it under a likes/views "stats strip"; our detail screen has no standalone stats
strip, so anchor it after the nutrition row and before ingredients. One card, full content width,
`spacing.lg` of top margin to separate it from the meta above.

### Data source

The `Recipe` entity carries only `ownerId` (`domain/recipes/recipe.ts:34`) — no embedded author
display fields. The author's `displayName` / `photoUrl` / `recipeCount` must be resolved from a
profile lookup keyed by `ownerId`. The `UserProfile` entity already exposes exactly these three
(`domain/user-profile/user-profile.ts`). **Ownership check:** `recipe.ownerId === authState.session.user.id`.

- **Owner case** (`isOwner === true`): title "Your recipe" / "Senin tarifin", name = signed-in user's
  `displayName`, avatar = user `photoUrl`, caption = own `recipeCount`, plus the "You" / "Sen" pill.
- **Other-author case**: title "Recipe by" / "Tarifin sahibi", name/avatar/caption from the resolved
  author profile, no pill.
- **Loading**: while the author profile resolves, render a `SkeletonLoader` block matching the card's
  height (avatar circle + two text lines). Do not flash an empty card.
- **Unavailable**: if the author profile can't be resolved (lookup fails / 404), **omit the card
  entirely** — it is non-essential and must never show a broken/empty author. No error state, no retry.

### Layout

- Single row, `flexDirection: row`, `alignItems: center`, `gap: spacing.md`.
- `padding: spacing.md`, `borderRadius: radii.xl`, 1px `cardBorder` hairline on `surface`.
- Avatar: `AvatarImage` at `sizes.avatarSm` (40) — prototype used 44; round down to the existing token
  (44 is not a token and 40 is the established small-avatar size). `flexShrink: 0`.
- Text column: `flex: 1`, `minWidth: 0`, three stacked lines:
  1. **Eyebrow** ("Recipe by" / "Your recipe"): `fontSizes.micro` (11), weight 700, `textMuted`,
     uppercase, `letterSpacing: 0.5`.
  2. **Name**: `fontSizes.body` (15), weight 700, `text`, single line, `numberOfLines={1}` ellipsis.
  3. **Caption** ("N recipes" / "N tarif"): `fontSizes.caption` (13), `textMuted`, `numberOfLines={1}`.
- "You" / "Sen" pill (owner only): `flexShrink: 0`, `borderRadius: radii.round`, vertical
  `spacing.xs2` (6) / horizontal `spacing.md` (12) padding, `chipBackground` fill, `chipText` label at
  `fontSizes.caption` weight 700.

### Tokens used

| Element | Token | Notes |
|---|---|---|
| Card bg | `colors.surface` | |
| Card border | `colors.cardBorder` | 1px hairline |
| Avatar | `AvatarImage` `size={sizes.avatarSm}` | reuse existing widget |
| Eyebrow label | `colors.textMuted`, `fontSizes.micro`, weight 700, uppercase | |
| Author name | `colors.text`, `fontSizes.body`, weight 700 | |
| Caption (recipe count) | `colors.textMuted`, `fontSizes.caption` | |
| "You" pill bg / text | `colors.chipBackground` / `colors.chipText` | proven AA pair (= `primaryLight`/`primary`, already used by all chips/badges across 20 themes) |

### Interaction & state

- The card is **not pressable** — render as a plain `View`, no `Pressable`, no `accessibilityRole="button"`.
- No pressed/hover state. No navigation.

### Accessibility

- Card is informational; group its text so a screen reader reads "Recipe by, {name}, {N} recipes" as one
  unit (wrap the text column with `accessible` + composed `accessibilityLabel`), or leave the three
  `ThemedText` nodes as-is (each is already plain text and individually legible).
- Contrast (all verified against existing token contracts, no new pairings introduced):
  `text` on `surface` ≥ 10.9:1 dark / passes light (the app's core body pair);
  `textMuted` on `surface` ≥ 4.5:1 (large-text eyebrow also passes the 3:1 floor);
  `chipText` on `chipBackground` is the app-wide chip pair, already AA-validated in all 20 themes.
- Avatar is decorative beside the name; no separate label needed.

### i18n keys

Reuse where present, add the two card titles. All four needed:

| Key | en | tr |
|---|---|---|
| `recipes.recipeBy` | `Recipe by` | `Tarifin sahibi` |
| `recipes.yourRecipe` | `Your recipe` | `Senin tarifin` |
| `recipes.youPill` | `You` | `Sen` |
| `recipes.recipeCount` | `{{count}} recipes` | `{{count}} tarif` |

`recipes.recipeCount` is a count caption — implement with an ICU/interpolated value (the app's `t()`
supports interpolation elsewhere; if not, format as `` `${count} ${t().recipes.recipesWord}` `` using a
bare noun key). Confirm with ts-developer which interpolation style the i18n layer uses before adding.

## Profile screen with embedded settings (Jun 2026)

Merge Settings into the Profile tab so appearance, account, and about live in one scroll, and strip the
profile down to identity + stats + a single "Edit profile" action. This **replaces the separate Settings
screen** as the primary path; the standalone `/settings` route's content moves up into the profile.

> Final design intent (chat19): **share button REMOVED** (action row is "Edit profile" only); **Activity
> section REMOVED**; **floating gear/settings + bell buttons REMOVED**; embedded sections appended below
> the profile content — Appearance (theme gallery + System/Light/Dark scheme selector + language),
> Account (sign out), About (app version). The stats row's 4th cell shows **saved-recipes count labeled
> "Saved" / "Kayıtlı"** instead of followers.

### Source

- Prototype: `project/src/new-screens.jsx` `ProfileScreen` (lines ~647–888) — especially the stats grid
  (~790), action row (~814), and the embedded Appearance / scheme selector / theme gallery / Account /
  About sections (~827–885). Tokens from `project/src/theme.js`.

### What moves / merges / is removed vs today

Compared with the current `presentation/screens/profile/profile-screen.tsx` and
`presentation/screens/settings/settings-screen.tsx`:

| Element | Today | After |
|---|---|---|
| Floating bell + gear (top-right, mobile) | present (`profile-screen.tsx:76–95`) | **removed** — notifications stay reachable from the web header / elsewhere; no settings entry needed (it's inline now) |
| Share button in action row | present (`profile-screen.tsx:213–219`) | **removed** |
| Web-only settings icon in action row | present (`profile-screen.tsx:203–212`) | **removed** (settings now inline) |
| Stats row | 3 cells: Recipes / Likes / Views | **4 cells**: Recipes / Likes / Views / **Saved** |
| Appearance group (mode toggle + language) | in `settings-screen.tsx:75–94` | **moves into profile**, below the action row |
| Theme palette grid | `settings-screen.tsx:96–97` (`ThemeGrid`) | **moves into profile** |
| Scheme System/Light/Dark control | `settings-screen.tsx` `ThemeToggle` (mode) | **moves into profile** as the appearance mode control |
| Account (sign out) | `settings-screen.tsx:99–107` | **moves into profile** |
| About (version + privacy + terms) | `settings-screen.tsx:109–131` | **moves into profile** (keep version; keep privacy/terms rows — they exist today and have no reason to drop) |
| Settings header back-button + title | `settings-screen.tsx:50–63` | **removed** — no separate screen chrome; it's one scroll |
| `/settings` route | standalone screen | keep the route as a thin redirect/alias to `/profile` **or** delete it; coordinate with rn-developer. Anything still pushing `/settings` (e.g. deep links) should land on the profile. |

### Layout (top → bottom, single `ScrollView`)

1. **Safe-area top** padding (mobile: `insets.top + spacing.sm`; web shell: 0) — same as today.
2. **Identity block** (unchanged from today): 112px avatar frame on `surface` with `cardBorder` + camera
   pill (`primary` fill, `background` ring, `primaryText` icon), then `displayName` (`title`, weight
   700), then `@handle` (`caption`, muted). Centered. `paddingTop: spacing.xxl`.
3. **Stats row** — `surface` card, `cardBorder`, `radii.xl`, `paddingVertical: spacing.md`, 4 equal
   cells split by `border` hairlines. Cells: Recipes / Likes / Views / **Saved**. Keep the existing
   loading (`ActivityIndicator`) and error/retry states for the first three (profile-derived); the
   Saved count comes from `savedRecipesStore` (always available locally — see Data).
4. **Action row** — single full-width "Edit profile" button: `flex: 1`, `height: 42`, `radii.lg`,
   `primary` fill, `primaryText` label + `create-outline` icon. **No share, no settings icon.**
   `marginTop: spacing.md`.
5. **Appearance section** — `SectionHeader` "Appearance", then:
   - Grouped card (`cardBackground`, `cardBorder`, `radii.lg`) holding the **mode control** row
     (System / Light / Dark) and a **Language** row. Reuse the existing `ThemeToggle` (or the prototype's
     3-up segmented `System/Light/Dark` — match whichever the app's `preference` model already supports;
     today's `ThemeToggle` already drives `preference`, so reuse it) and `LanguageSelector`.
   - **Theme gallery**: `SectionHeader` "Theme palette" then the existing `ThemeGrid`
     (`selectedThemeId` / `onSelect`). The prototype renders a horizontal swatch strip; our `ThemeGrid`
     is the established equivalent — reuse it, do not rebuild.
6. **Account section** — `SectionHeader` "Account", grouped card with a single destructive
   `SettingsRow` "Sign out" (`log-out-outline`, `destructive`, `onPress` → sign out → `replace('/login')`).
7. **About section** — `SectionHeader` "About", grouped card: Version row (`information-circle-outline`,
   right element `1.0.0`, no chevron) + Privacy policy row + Terms of use row (both `Linking.openURL`,
   keep from today's settings screen).
8. **Bottom spacer** — `insets.bottom + sizes.tabBarHeight + spacing.xxl` so content clears the tab bar.

Section spacing: `SectionHeader` provides its own vertical rhythm; groups sit at `marginHorizontal:
spacing.lg`. Use `spacing.lg` between major sections, `spacing.md` between a section header's siblings —
**all via tokens, never numeric literals** (the prototype's raw `spacing.lg`/`radii.lg`/`shadowCSS.sm`
map 1:1 to our `spacing`, `radii`, `shadows`).

### Tokens used

| Element | Token | Notes |
|---|---|---|
| Container bg | `colors.background` | |
| Avatar frame bg / border | `colors.surface` / `colors.cardBorder` | + `shadows.sm` |
| Camera pill bg / icon / ring | `colors.primary` / `colors.primaryText` / `colors.background` | |
| Display name | `colors.text`, `fontSizes.title`, weight 700 | via `ThemedText variant="title"` |
| Handle | `colors.textMuted`, `fontSizes.caption` | |
| Stats card bg / border | `colors.surface` / `colors.cardBorder` | `radii.xl` |
| Stat cell divider | `colors.border` | 1px, between cells only |
| Stat value | `colors.text`, `fontSizes.subtitle` (18), weight 800 | |
| Stat label | `colors.textMuted`, `fontSizes.nano` (10) eqv → use `fontSizes` token, weight 600, uppercase, `letterSpacing: 0.5` | prototype used 10; nearest token is `nano` (9) — use `nano` or keep current screen's 10 if it's already a literal exception; prefer `fontSizes.nano` |
| Edit button bg / label | `colors.primary` / `colors.primaryText` | |
| Group card bg / border | `colors.cardBackground` / `colors.cardBorder` | `radii.lg` |
| Settings row icon (accent) | `colors.primary` | |
| Sign out row | `destructive` (→ `colors.danger`) | |
| Section header | existing `SectionHeader` widget | |

### Interaction & state

- Edit profile → `router.push('/edit-profile')` (existing route).
- Mode control → drives `preference` via `setPreference` (existing). Language → `setLocale` (existing).
- Theme swatch tap → `setThemeId` (existing). Sign out → `signOut()` then `router.replace('/login')`.
- Pressed states on buttons: use `Pressable`'s `pressed` arg for `opacity: 0.85`; do not add custom.
- Stats loading: keep the current `ActivityIndicator`; error: keep the current inline retry
  (`Pressable` → `loadProfile(userId)`). Saved cell renders immediately from local store (no async).

### Accessibility

- Every `Pressable` keeps `accessibilityRole="button"` + `accessibilityLabel` (edit profile, camera,
  sign out, theme swatches, mode/language controls — all already labeled in the current screens; carry
  the labels over).
- Min tap target 44×44 on the camera pill, edit button (height 42 → add hit slop or bump to 44), and
  settings rows (`sizes.settingsRowHeight` 52 is fine).
- Contrast: **no new pairings** — every token combo above is already used and AA-validated in the
  current profile/settings screens. The new 4th stat cell reuses the exact `text`/`textMuted`-on-`surface`
  pairs of the other three cells, so it inherits their validation.

### i18n keys

All already exist except confirm the saved label. Reuse:

| Key | en | tr | Status |
|---|---|---|---|
| `profile.editProfile` | `Edit profile` | (existing tr) | exists |
| `profile.recipes` / `.likes` / `.views` | `Recipes` / `Likes` / `Views` | (existing) | exist |
| `profile.saved` | `Saved` | `Kayıtlı` | **add** (`tr.ts` must mirror; en likely `Saved`) — verify `profile.saved` not already taken; if the existing `profile`-adjacent `saved` is a different sense, add `profile.savedStat` |
| `settings.appearance` / `.themePalette` / `.account` / `.about` / `.version` / `.signOut` / `.language` / `.mode` | (existing) | (existing) | exist — reused in-place |
| `settings.privacyPolicy` / `.termsOfUse` | (existing) | (existing) | exist |

**Remove from use** (no longer rendered, but leave the keys for now unless ts-developer prunes): the
`profile.activity*`, `profile.followers`, and `profile.shareProfile` keys. Flag `profile.shareProfile`,
`profile.followers`, and the `profile.activity*` set as now-unused for a later cleanup pass.

## Web Home (`WebRecipesPage`) Redesign (Jun 2026)

**Date:** 2026-06-19. **Scope:** web shell only (`isWebShell === true`). Mobile layout, mobile
collapsing header, and the mobile `TrendingStrip` are untouched by this section.

**Source of truth:** Claude Design prototype `src/web-pages.jsx` (`WebRecipesPage` component).

**One-sentence purpose:** Replace the current web home's flat filter-pill + list with a full editorial
layout: a hero zone (featured recipe + 2 mini-cards), an AI promo banner, a cuisine tile grid, and a
recipe grid with inline difficulty segmented control and a sort dropdown.

---

### References

- **Apple HIG — Large Type & Hero layout** (developer.apple.com/design/human-interface-guidelines) —
  large hero card with full-bleed cover image and bottom gradient overlay; author byline row below title.
- **Material 3 — Expressive Cards** (m3.material.io) — 1px cardBorder hairline on `surface` replaces
  shadow on dark themes; card `borderRadius` at the `xxl2` (28px) tier for large hero, `xxl` (24px) for
  recipe grid cards.
- **Mobbin / Yummly web feed** — ranked mini-cards at right of hero with a numbered badge at top-left;
  segmented difficulty control inline with the section header row.

---

### A. Component Breakdown

The rn-developer must create these files. All are web-only components (`isWebShell` is their exclusive
render context and they are **never** imported by mobile screens). One declaration + its `Props`
interface per file.

| File | Exports | Purpose |
|---|---|---|
| `presentation/screens/recipes/web-hero-section.tsx` | `WebHeroSection`, `WebHeroSectionProps` | Renders the 1.9fr/1fr CSS grid: featured card left, two mini-cards right. Consumes `trendingRecipesStore` directly (same pattern as `TrendingStrip`). |
| `presentation/screens/recipes/web-hero-featured-card.tsx` | `WebHeroFeaturedCard`, `WebHeroFeaturedCardProps` | Big left card: bleed image, diagonal gradient overlay, badge pill, h1 title, author row, meta row, two action buttons. |
| `presentation/screens/recipes/web-hero-mini-card.tsx` | `WebHeroMiniCard`, `WebHeroMiniCardProps` | Compact right card: bleed image, bottom gradient, rank badge, title + meta at bottom. |
| `presentation/screens/recipes/web-ai-banner.tsx` | `WebAiBanner`, `WebAiBannerProps` | Full-width AI promo button, wide layout with sparkle decoration and subtitle text. |
| `presentation/screens/recipes/web-cuisine-grid.tsx` | `WebCuisineGrid`, `WebCuisineGridProps` | Tile grid (auto-fill, minmax 110px) of cuisine tiles. Consumes `useTaxonomyOptions` + `useTaxonomyLabel`. |
| `presentation/screens/recipes/web-section-head.tsx` | `WebSectionHead`, `WebSectionHeadProps` | Reusable section heading: title (h2 role) + sub + optional `right` slot. |
| `presentation/screens/recipes/web-sort-menu.tsx` | `WebSortMenu`, `WebSortMenuProps` | 42px sort button that opens the existing `BottomSheet` (or an inline `View`-based dropdown). |
| `presentation/screens/recipes/web-recipe-grid.tsx` | `WebRecipeGrid`, `WebRecipeGridProps` | Section head + difficulty segmented control + sort menu + auto-fill recipe card grid + empty state. Wraps `RecipeListItem`. |

The existing `RecipeListItem` (and therefore `RecipeCard`) is **reused unchanged** for the recipe grid
cards with an extended props surface — the `WebRecipeCard`-specific hover lift requires a CSS class
injected via `style` prop on web. The hero sections use their own full-bleed image layout and must NOT
reuse `RecipeCard`.

The existing `AiBannerCard` is **replaced on web** by `WebAiBanner`. The new file is web-only; the
original compact `AiBannerCard` continues to serve mobile.

The existing `CuisineStrip` (horizontal scroll) is **replaced on web** by `WebCuisineGrid` (tile grid).
The `CuisineStrip` continues to serve mobile unchanged.

The existing `TrendingStrip` is **removed from mobile** (this was committed separately; the spec here
only governs web) and is **replaced on web** by the hero section's featured + mini cards. Removing it
from the web render path is part of `WebHeroSection`'s job: it owns its own data source so
`RecipeListScreen`'s web branch can stop rendering `<TrendingStrip>`.

---

### B. Layout — `RecipeListScreen` web branch

The web branch of `RecipeListScreen` (`isWebShell === true`) currently renders:

```
RecipesAppHeader
stickyHeader  (filter pill + sort pill + count + active-filter chips)
AiBannerCard
TrendingStrip
CuisineStrip
FlatList (recipe grid)
```

After this redesign it renders:

```
RecipesAppHeader          (unchanged)
stickyHeader              (filter pill + sort pill — keep for now; see note below)
[when NOT searching:]
  WebHeroSection          (replaces TrendingStrip)
  WebAiBanner             (replaces AiBannerCard)
  WebCuisineGrid          (replaces CuisineStrip)
WebRecipeGrid             (replaces the bare FlatList — owns its own section head + controls)
```

**Searching** is defined as `webSearchQuery.trim().length > 0`. When searching, show only
`WebRecipeGrid` (the section head title changes to "Search results"; hero, banner, cuisine grid are
hidden). This mirrors the prototype's `!searching` guard.

The existing `stickyHeader` (filter + sort pills, active-filter chips row) keeps its position above
the hero for now. The filter sheet and sort sheet are unchanged. Connecting the sort state between the
`stickyHeader` sort pill and `WebSortMenu` inside `WebRecipeGrid` is the rn-developer's responsibility
— both should drive the same `sortBy` / `setSortBy` state (already present in `RecipeListScreen`).

All web content is wrapped in a centered container:
- `maxWidth: 1200`
- `alignSelf: 'center'`
- `width: '100%'`
- `paddingHorizontal: spacing.xxl` (32px, matching prototype's `wpPage`)

This container wraps `WebHeroSection`, `WebAiBanner`, `WebCuisineGrid`, and `WebRecipeGrid`.
`RecipesAppHeader` and `stickyHeader` remain full-width.

---

### C. Sub-component Specs

#### C.1 `WebHeroSection`

**File:** `presentation/screens/recipes/web-hero-section.tsx`

**Purpose:** Renders the 1.9fr/1fr editorial hero split. Consumes `trendingRecipesStore` via
`useStores()`. Shows nothing (returns `null`) until the store has at least 3 loaded recipes. Shows a
skeleton while loading (see States).

**Props:**
```ts
export interface WebHeroSectionProps {
  onOpenRecipe: (id: string) => void;
}
```

**Layout:**

- Outer `View`: `flexDirection: 'row'`, `gap: spacing.sm2` (10), `marginBottom: spacing.lg`.
- Left child: `flex: 1.9` (`{ flex: 1.9, minWidth: 0 }`), renders `WebHeroFeaturedCard`.
- Right child: `flex: 1` (`{ flex: 1, minWidth: 0 }`), `flexDirection: 'column'`, `gap: spacing.sm2`,
  renders two `WebHeroMiniCard`s stacked.
- `featured = trending[0]`, `mini1 = trending[1]` (rank 2), `mini2 = trending[2]` (rank 3).

**States:**

- Loading: left slot renders a `SkeletonLoader` `width="100%"` `height={sizes.heroImageHeightWeb}` with
  `borderRadius={radii.xxl2}`; right slot renders two `SkeletonLoader`s each `width="100%"`
  `height={(sizes.heroImageHeightWeb - spacing.sm2) / 2}` with `borderRadius={radii.xxl}`.
- Error / fewer than 3 recipes: return `null` (no partial hero — the section simply disappears).
- Loaded: render the two card components.

**Responsive note:** at `width < 700` (narrower web window), fall back to a single-column stack —
`flexDirection: 'column'`, `flex` values irrelevant. The rn-developer should gate on
`useLayout().width < 700` (the existing `useLayout` hook is available). Below that threshold, render
`WebHeroFeaturedCard` alone (full width), omit the two mini-cards. The 1.9/1 split is only for
`width >= 700`.

#### C.2 `WebHeroFeaturedCard`

**File:** `presentation/screens/recipes/web-hero-featured-card.tsx`

**Props:**
```ts
export interface WebHeroFeaturedCardProps {
  recipe: Recipe;
  onPress: (id: string) => void;
  onSave?: (id: string) => void;
  savedByMe?: boolean;
}
```

**Layout (all absolute-positioned content over a full-bleed image):**

- Outer `Pressable`: `borderRadius: radii.xxl2` (28), `overflow: 'hidden'`,
  `minHeight: sizes.heroImageHeightWeb` (440). No separate bg — image fills it.
- `RecipeImage` (reuse existing widget): `position: 'absolute'`, `top: 0, left: 0, right: 0, bottom: 0`,
  `resizeMode: 'cover'`.
- Diagonal gradient overlay (`LinearGradient`): `position: 'absolute'`, `top: 0, left: 0, right: 0, bottom: 0`.
  Colors (as a `[string, string, string, string]` array for 4 stops): map to color tokens:
  - Stop 0 (0%): `heroOverlayDeep` — see new tokens table below.
  - Stop 1 (45%): `heroOverlayMid` — see new tokens table.
  - Stop 2 (80%): `heroOverlayFade` — see new tokens table.
  - Stop 3 (100%): `heroOverlayFade`.
  - `start={{ x: 0.15, y: 1 }}` `end={{ x: 0.85, y: 0 }}` (approximates the 105deg prototype diagonal).
- Content `View`: `position: 'absolute'`, `bottom: 0, left: 0, right: 0`,
  `padding: spacing.xxxl` (48), `gap: spacing.md`.

Content inside the content View, top to bottom:

1. **Trending pill badge:** `flexDirection: 'row'`, `alignItems: 'center'`, `gap: spacing.xs`,
   `alignSelf: 'flex-start'`, `borderRadius: radii.round`, `paddingHorizontal: spacing.md`,
   `paddingVertical: spacing.xs2`, `backgroundColor: colors.primary`. Children:
   - `Ionicons` `name="flame"` `size={sizes.iconSm}` `color={colors.primaryText}`.
   - `ThemedText` `fontSize={fontSizes.small}` (12) `fontWeight='700'`
     `letterSpacing={0.5}` `style={{ color: colors.primaryText, textTransform: 'uppercase' }}`
     — text: `t().recipes.trending` (already exists).

2. **Title:** `ThemedText` `fontSize={fontSizes.hero}` (44) `fontWeight='800'`
   `lineHeight={fontSizes.hero * 1.04}` `letterSpacing={-1}`
   `style={{ color: colors.onOverlay, textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 8 }}`
   `numberOfLines={3}` — text: `recipe.name`.

3. **Author row:** `flexDirection: 'row'`, `alignItems: 'center'`, `gap: spacing.sm`.
   - `AvatarImage` `size={sizes.heroAvatarSm}` (28 — new token, see below) `uri={recipe.authorPhotoUrl}` `name={recipe.authorName}`.
   - `ThemedText` `fontSize={fontSizes.body}` `style={{ color: colors.onOverlay }}` — text built
     from i18n: `t().recipes.heroByAuthor` where `{name}` is replaced by `recipe.authorName`.

4. **Meta row:** `flexDirection: 'row'`, `alignItems: 'center'`, `gap: spacing.lg`,
   `flexWrap: 'wrap'`.
   - Star + rating: `Ionicons` `name="star"` `size={sizes.iconSm}` `color={colors.starFilled}` +
     `ThemedText` `fontSize={fontSizes.medium}` (14.5 → use `fontSizes.medium` = 14) `style={{ color: colors.onOverlay }}`.
   - Clock + total time: `Ionicons` `name="time-outline"` + `ThemedText`
     `t().recipes.heroTotalMin` where `{n}` = `recipe.prepTimeMinutes + recipe.cookTimeMinutes`.
   - Gauge + difficulty: `Ionicons` `name="speedometer-outline"` + `ThemedText`
     `recipe.difficulty` (display string from `useTaxonomyLabel` if available, else raw).

5. **Button row:** `flexDirection: 'row'`, `gap: spacing.md`, `marginTop: spacing.xs2`.
   - **View Recipe button:** `height: sizes.heroActionBtn` (50 — new token), `borderRadius: radii.lg`,
     `backgroundColor: colors.onOverlay` (#FFFFFF always), `paddingHorizontal: spacing.xl`,
     `alignItems: 'center'`, `justifyContent: 'center'`.
     Label: `ThemedText` `fontWeight='700'` `fontSize={fontSizes.body}` `style={{ color: colors.heroButtonText }}`.
     `accessibilityRole="button"`, `accessibilityLabel={t().recipes.viewRecipe}`.
   - **Save button:** `height: sizes.heroActionBtn`, `borderRadius: radii.lg`,
     `backgroundColor: colors.heroSaveBg`, `borderWidth: 1`, `borderColor: colors.onOverlay`,
     `paddingHorizontal: spacing.xl`, `alignItems: 'center'`, `justifyContent: 'center'`.
     Label: `ThemedText` `fontWeight='700'` `fontSize={fontSizes.body}` `style={{ color: colors.onOverlay }}`.
     Text: `savedByMe ? t().recipes.saved : t().recipes.save`.
     `accessibilityRole="button"`, `accessibilityLabel={savedByMe ? t().recipes.saved : t().recipes.save}`.

**Press:** `onPress={() => onPress(recipe.id)}` on the outer `Pressable`. Pressed state: `opacity: 0.92`
via `Pressable`'s `pressed` arg. The Save button's `onPress={() => onSave?.(recipe.id)}` stops
propagation (`event.stopPropagation()` on web — use separate `Pressable` with `onPress` that does NOT
call the outer handler).

#### C.3 `WebHeroMiniCard`

**File:** `presentation/screens/recipes/web-hero-mini-card.tsx`

**Props:**
```ts
export interface WebHeroMiniCardProps {
  recipe: Recipe;
  rank: number;   // 2 or 3
  onPress: (id: string) => void;
}
```

**Layout:**

- Outer `Pressable`: `borderRadius: radii.xxl` (24), `overflow: 'hidden'`, `flex: 1` (to fill the
  right-column slot), `minHeight: sizes.heroMiniMinHeight` (new token — see below).
- `RecipeImage`: `position: 'absolute'`, `top: 0, left: 0, right: 0, bottom: 0`, `resizeMode: 'cover'`.
- Bottom gradient (`LinearGradient`): `position: 'absolute'`, `bottom: 0, left: 0, right: 0`,
  `height: '60%'`, colors: `[colors.heroOverlayFade, colors.heroOverlayDeep]`,
  `start={{ x: 0, y: 0 }}` `end={{ x: 0, y: 1 }}`.
- **Rank badge:** `position: 'absolute'`, `top: spacing.md`, `left: spacing.md`.
  A `View`: `width: sizes.rankBadge` (26 — new token), `height: sizes.rankBadge`, `borderRadius: radii.round`,
  `backgroundColor: colors.onOverlay`, `alignItems: 'center'`, `justifyContent: 'center'`.
  Inner `ThemedText` `fontWeight='700'` `fontSize={fontSizes.body}` `style={{ color: colors.heroButtonText }}`.
  Text: `String(rank)`.
- **Bottom content:** `position: 'absolute'`, `bottom: 0, left: 0, right: 0`,
  `padding: spacing.md`, `gap: spacing.xs`.
  - Title: `ThemedText` `fontWeight='700'` `fontSize={fontSizes.heading}` (17 → `fontSizes.heading` = 16;
    nearest token — use `fontSizes.heading`) `numberOfLines={2}` `style={{ color: colors.onOverlay }}`.
  - Meta row: `flexDirection: 'row'`, `alignItems: 'center'`, `gap: spacing.sm`.
    - `Ionicons` `name="star"` `size={sizes.iconSm}` `color={colors.starFilled}` +
      `ThemedText` `fontSize={fontSizes.small}` (12.5 → use `fontSizes.small` = 12) `style={{ color: colors.onOverlay }}`.
    - `Ionicons` `name="time-outline"` `size={sizes.iconSm}` `color={colors.onOverlay}` +
      `ThemedText` `fontSize={fontSizes.small}` `style={{ color: colors.onOverlay }}`
      text: `${recipe.prepTimeMinutes + recipe.cookTimeMinutes} ${t().recipes.minutes}`.

**Press:** `onPress(() => onPress(recipe.id))`. Pressed: `opacity: 0.88`.

#### C.4 `WebAiBanner`

**File:** `presentation/screens/recipes/web-ai-banner.tsx`

**Props:**
```ts
export interface WebAiBannerProps {
  onPress: () => void;
}
```

**Layout:**

- Outer `Pressable`: `marginBottom: spacing.lg`.
- `LinearGradient` child: `colors={[colors.primaryGradientStart, colors.primaryGradientEnd]}`,
  `start={{ x: 0, y: 0 }}` `end={{ x: 1, y: 0 }}` (120deg → horizontal),
  `style`: `borderWidth: 1`, `borderColor: colors.gradientBorder`, `borderRadius: radii.xxl`,
  `paddingVertical: spacing.xl` (22px → `spacing.xl` = 24), `paddingHorizontal: spacing.xxl` (26px → `spacing.xxl` = 32),
  `flexDirection: 'row'`, `alignItems: 'center'`, `gap: spacing.lg`, `overflow: 'hidden'`.

Children:

1. **Sparkle decoration** (`View`, `position: 'absolute'`, `top: -spacing.lg`, `right: -spacing.md`,
   `opacity: 0.12`, `pointerEvents: 'none'`):
   `Ionicons` `name="sparkles"` `size={sizes.sparkleDecor}` (new token = 80) `color={colors.onOverlay}`.

2. **Icon tile** (`View`, `width: sizes.aiBannerIcon` (52 — new token), `height: sizes.aiBannerIcon`,
   `borderRadius: radii.lg`, `backgroundColor: colors.gradientSurface`, `borderWidth: 1`,
   `borderColor: colors.gradientBorder`, `alignItems: 'center'`, `justifyContent: 'center'`,
   `flexShrink: 0`):
   `Ionicons` `name="sparkles"` `size={sizes.iconXl}` (32) `color={colors.onOverlay}`.

3. **Text block** (`View`, `flex: 1`, `gap: spacing.xs`):

   Wrap this block in a `View` with `backgroundColor: colors.overlayLight` (rgba(0,0,0,0.4)),
   `borderRadius: radii.sm`, `paddingHorizontal: spacing.sm`, `paddingVertical: spacing.xs2`.
   This scrim is required for the subtitle to pass WCAG AA (4.5:1) on light themes where gradient
   starts are too bright for white text. Verified: `overlayLight` over light-theme gradient starts
   yields ≥ 7.0:1 for white (e.g., lime-zest 7.14:1, pearl-white 8.11:1).

   - Title: `ThemedText` `fontWeight='800'` `fontSize={fontSizes.subtitle}` (18)
     `style={{ color: colors.onOverlay }}` — text: `t().recipes.aiPromo`.
   - Subtitle: `ThemedText` `fontWeight='400'` `fontSize={fontSizes.medium}` (14)
     `style={{ color: colors.onOverlay, opacity: 0.9 }}` — text: `t().recipes.aiPromoSubtitle`.

4. **Start chip** (`View`, `flexShrink: 0`, `flexDirection: 'row'`, `alignItems: 'center'`,
   `gap: spacing.xs`, `backgroundColor: colors.primary`, `borderRadius: radii.round`,
   `paddingVertical: spacing.xs2`, `paddingHorizontal: spacing.md`):
   - `ThemedText` `fontWeight='700'` `fontSize={fontSizes.caption}` `style={{ color: colors.primaryText }}` — `t().recipes.aiStart`.
   - `Ionicons` `name="chevron-forward"` `size={sizes.iconSm}` `color={colors.primaryText}`.

   Rationale for `primary`/`primaryText` chip instead of white chip: white chip with dark-theme
   primaries yields as low as 2.54:1 (pearl-white dark `#60A5FA` on `#FFFFFF`). The contracted
   primary pair is guaranteed ≥ 4.5:1 across all 20 themes.

**Press:** `onPress` on the outer `Pressable`. Pressed: `opacity: 0.88`.
`accessibilityRole="button"`, `accessibilityLabel={t().recipes.aiPromo}`.

#### C.5 `WebCuisineGrid`

**File:** `presentation/screens/recipes/web-cuisine-grid.tsx`

**Props:**
```ts
export interface WebCuisineGridProps {
  selectedCuisines: string[];
  onToggle: (cuisine: string) => void;
}
```

**Layout:**

- `WebSectionHead` above: `title={t().recipes.browseCuisines}` `sub={t().recipes.filterByCuisine}`.
- Tile grid: `View` with `flexDirection: 'row'`, `flexWrap: 'wrap'`, `gap: spacing.md`,
  `marginBottom: spacing.lg`.
- Each **cuisine tile** (`Pressable`):
  - `flexDirection: 'column'`, `alignItems: 'center'`, `gap: spacing.sm`,
    `paddingVertical: spacing.lg`, `paddingHorizontal: spacing.sm`,
    `borderRadius: radii.xl`, `borderWidth: 1.5`,
    `minWidth: sizes.cuisineTileMin` (new token = 110), determined by `flexWrap`.
    - Active: `backgroundColor: colors.chipBackground`, `borderColor: colors.primary`.
    - Inactive: `backgroundColor: colors.cardBackground`, `borderColor: colors.cardBorder`.
  - Emoji: `ThemedText` `fontSize={fontSizes.subheading}` (20) — emoji from `cuisineLabel(k).emoji`.
  - Label: `ThemedText` `fontWeight='600'` `fontSize={fontSizes.small}` (13)
    `style={{ color: active ? colors.chipText : colors.textMuted }}` `numberOfLines={1}`.
  - `accessibilityRole="button"`, `accessibilityLabel={name}`.

**First tile** is "All" / "Tümü" with `emoji="🍽️"` and `name=t().recipes.cuisineAll`. It represents
the "no cuisine filter" state: active when `selectedCuisines.length === 0`. Pressing it calls
`onToggle('ALL')` — the rn-developer must handle `'ALL'` as a special key that resets cuisines to `[]`.

The remaining tiles are driven by `useTaxonomyOptions().cuisineKeys` and `useTaxonomyLabel()`,
exactly as `CuisineStrip` already does — no hardcoded list.

**Responsive:** at `width < 500`, reduce `minWidth` to 90px to keep at least 4 tiles per row.
Implement as `width < 500 ? sizes.cuisineTileMinSm : sizes.cuisineTileMin` (both tokens in sizing
table below).

#### C.6 `WebSectionHead`

**File:** `presentation/screens/recipes/web-section-head.tsx`

**Props:**
```ts
export interface WebSectionHeadProps {
  title: string;
  sub?: string;
  right?: React.ReactNode;   // holds difficulty segmented control + sort menu on the recipe grid
}
```

**Layout:** `flexDirection: 'row'`, `alignItems: 'flex-end'`, `justifyContent: 'space-between'`,
`marginBottom: spacing.md`.

- Left column: `flex: 1`.
  - Title: `ThemedText` `fontWeight='800'` `fontSize={fontSizes.display}` (22)
    `letterSpacing={-0.4}` — rendered as an `h2`-role element. Use `accessibilityRole="header"`.
  - Sub (if present): `ThemedText` `fontSize={fontSizes.medium}` `style={{ color: colors.textMuted }}`
    `marginTop={spacing.xxs}`.
- Right slot: `right` rendered as-is.

#### C.7 `WebSortMenu`

**File:** `presentation/screens/recipes/web-sort-menu.tsx`

**Props:**
```ts
export interface WebSortMenuProps {
  current: SortKey;
  onChange: (key: SortKey) => void;
}
```

**Layout:**

A `Pressable` button (height: `sizes.webSortBtn` = 42 — new token) that opens the existing
`BottomSheet` sort picker (already present in `RecipeListScreen`). On web, tapping sets
`sheetOpen('sort')` in the parent screen. The button renders:

- `borderWidth: 1`, `borderColor: colors.cardBorder`, `borderRadius: radii.lg`,
  `paddingHorizontal: spacing.md`, `height: sizes.webSortBtn`, `flexDirection: 'row'`,
  `alignItems: 'center'`, `gap: spacing.xs`, `backgroundColor: colors.surface`.
- `ThemedText` `fontSize={fontSizes.caption}` `style={{ color: colors.textMuted }}` — `t().recipes.sortBy` + `:`.
- `ThemedText` `fontSize={fontSizes.caption}` `fontWeight='600'` `style={{ color: colors.text }}` — `sortLabels[current]`.
- `Ionicons` `name="chevron-down"` `size={sizes.iconSm}` `color={colors.textMuted}`.

`WebSortMenu` does NOT own or render the sheet — it only calls `onChange`. The parent (`WebRecipeGrid`
or the screen) handles `sheetOpen` state.

#### C.8 `WebRecipeGrid`

**File:** `presentation/screens/recipes/web-recipe-grid.tsx`

**Props:**
```ts
export interface WebRecipeGridProps {
  recipes: Recipe[];
  isSearching: boolean;
  activeCuisine: string | null;  // first item from filters.cuisines, or null
  sortBy: SortKey;
  onSortChange: (key: SortKey) => void;
  activeDifficulty: Difficulty | null;
  onDifficultyChange: (d: Difficulty | null) => void;
  gridColumns: number;
  onOpenRecipe: (id: string) => void;
}
```

**Layout (top to bottom):**

1. **Section head row** (`WebSectionHead`):
   - `title`: when `isSearching` → `t().recipes.webSearchResults`; when `activeCuisine` →
     `t().recipes.webCuisineRecipes` (interpolated with cuisine name); else `t().recipes.webAllRecipes`.
   - `sub`: `t().recipes.webRecipesCount` where `{n}` = `recipes.length`.
   - `right` slot: difficulty control + sort menu, `flexDirection: 'row'`, `gap: spacing.md`, `alignItems: 'center'`.

2. **Difficulty segmented control** (inside `right` slot):
   - Pill container: `flexDirection: 'row'`, `backgroundColor: colors.surface`, `borderWidth: 1`,
     `borderColor: colors.cardBorder`, `borderRadius: radii.lg`, `padding: spacing.xxs` (3 → use `spacing.xxs` = 2).
   - Four buttons — All / Easy / Medium / Hard. Labels: `t().recipes.difficultyAll` and the three
     existing `difficulty` label keys (see i18n table). Each button:
     - `paddingHorizontal: spacing.md`, `paddingVertical: spacing.xs2`, `borderRadius: radii.md`.
     - Active: `backgroundColor: colors.cardBackground`, `shadows.sm`.
     - Inactive: `backgroundColor: 'transparent'`.
     - `ThemedText` `fontSize={fontSizes.caption}` `fontWeight={active ? '700' : '400'}` `style={{ color: colors.text }}`.
   - Active difficulty is local state lifted from `activeDifficulty` prop. Pressing "All" sets
     `onDifficultyChange(null)`; pressing a difficulty calls `onDifficultyChange(d)`.

3. **`WebSortMenu`** (inside `right` slot): `current={sortBy}` `onChange={onSortChange}`.
   On press opens the existing standalone sort `BottomSheet` (`sheetOpen === 'sort'`). The
   `WebRecipeGrid` calls `onSortChange` which bubbles to the screen.

4. **Recipe card grid** (`FlatList` with `numColumns={gridColumns}`):
   - Style mirrors the existing web FlatList in `RecipeListScreen` exactly:
     `key={grid-${gridColumns}}`, `columnWrapperStyle={styles.gridRow}` when `gridColumns > 1`,
     `contentContainerStyle`: `gap: GRID_GAP` between rows, `paddingBottom: spacing.xxl`.
   - `renderItem`: for each recipe, render `RecipeListItem` inside `View style={styles.gridCell}`.
   - Hover lift: on web, the `RecipeCard` `Pressable` can be given `style={{ cursor: 'pointer' }}`
     and CSS-based `transform` via `onMouseEnter` / `onMouseLeave`. Implement as:
     - `onMouseEnter`: `scale.value = withTiming(1.02, {duration: 160})`; `elevation.value = 8`.
     - `onMouseLeave`: `scale.value = withTiming(1, {duration: 160})`; elevation reset.
     - The existing `RecipeCard`'s `animatedStyle` already drives a `scale` shared value — extend its
       props to accept an optional `hoverEffect?: boolean` (web only) so the card enables the mouse
       handlers when `hoverEffect && Platform.OS === 'web'`.
     - Image scale 1.05 on hover: wrap `RecipeImage` in its own `Animated.View` with separate shared
       value inside `RecipeCard`.
     This is a `RecipeCard` prop extension — coordinate with rn-developer.

5. **Empty state:** `View` with `borderWidth: 1.5`, `borderStyle: 'dashed'`,
   `borderColor: colors.border`, `borderRadius: radii.xl`, `padding: spacing.xxxl`,
   `alignItems: 'center'`, `gap: spacing.md`.
   - `View` circle: `width: sizes.webEmptyIcon` (56 — new token), `height: sizes.webEmptyIcon`,
     `borderRadius: radii.round`, `backgroundColor: colors.surface`, `alignItems: 'center'`, `justifyContent: 'center'`.
     Inside: `Ionicons` `name="search"` `size={sizes.iconXl}` (32) `color={colors.textMuted}`.
   - `ThemedText` `fontWeight='700'` `fontSize={fontSizes.subtitle}` `style={{ color: colors.text }}` — `t().recipes.noResults`.
   - `ThemedText` `fontSize={fontSizes.body}` `style={{ color: colors.textMuted }}` — `t().recipes.webEmptyBody`.

---

### D. New Token Table

All new tokens are purely layout / size / color tokens. None change any existing color semantics.

#### D.1 New `sizes` tokens — add to `presentation/base/theme/spacing.ts`

| Token | Value | Notes |
|---|---|---|
| `heroImageHeightWeb` | `440` | Already exists in spacing.ts — no change needed. |
| `heroAvatarSm` | `28` | Hero featured card author avatar. |
| `heroActionBtn` | `50` | Height of View Recipe / Save buttons in hero card. |
| `heroMiniMinHeight` | `205` | Minimum height of each `WebHeroMiniCard` so two fill the 440px hero height minus the 10px gap: `(440 - 10) / 2 = 215`; rounded to 205 as a floor. |
| `rankBadge` | `26` | White rank-number circle on `WebHeroMiniCard`. |
| `aiBannerIcon` | `52` | Square icon tile in `WebAiBanner`. |
| `sparkleDecor` | `80` | Faint background sparkle decoration in `WebAiBanner`. |
| `cuisineTileMin` | `110` | Min width of a cuisine tile in `WebCuisineGrid` (≥700px window). |
| `cuisineTileMinSm` | `90` | Min width of a cuisine tile in `WebCuisineGrid` (<500px window). |
| `webSortBtn` | `42` | Height of `WebSortMenu` trigger button. |
| `webEmptyIcon` | `56` | Diameter of the circular icon container in the recipe-grid empty state. |
| `webContentMax` | `1200` | Already implicit as a literal in `RecipeListScreen`; consolidate here. (The existing `RECIPE_CARD_MIN_WIDTH = 320` and `listCenter` styles use `maxWidth: 1200` as a literal — rn-developer should replace those with `sizes.webContentMax`.) |
| `webContentPadding` | `32` | Horizontal page padding (`spacing.xxl`). Alias only — not a new value, maps to `spacing.xxl`. Document for clarity; do not add as a separate token (redundant with `spacing.xxl`). |

#### D.2 New color tokens — add to `ThemeColors` + `makeColors` in `presentation/base/theme/themes.ts`

Three new semantic tokens are required. Both dark and light variants use the same constant values
because they represent on-image content that is always darker regardless of theme.

| Token | Dark value | Light value | Rationale |
|---|---|---|---|
| `heroButtonText` | `#0F172A` | `#0F172A` | Dark text on white "View Recipe" button. `colors.primary` in dark themes can be a bright pastel (e.g., pearl-white dark `#60A5FA`) that yields only 2.54:1 on white — fails AA. `#0F172A` is always ≥ 17.85:1 on `#FFFFFF`. |
| `heroSaveBg` | `rgba(255,255,255,0.14)` | `rgba(255,255,255,0.14)` | Translucent frosted Save button bg. Always sits over a dark hero overlay, making effective bg ≥ 9:1 against white text. Cannot be a solid hex because it must show through to the gradient behind. Cannot use `colors.gradientSurface` (rgba(255,255,255,0.18)) since it is already contracted for the icon badge; a distinct token prevents future drift. |
| `heroOverlayDeep` | `rgba(15,23,42,0.9)` | `rgba(15,23,42,0.9)` | Darkest stop of the hero diagonal gradient (0% anchor, left/bottom). 0.9 alpha over any image pixel yields ≥ 13.5:1 for white text (worst case verified: white pixel → #272E3F → cr 13.56:1). |
| `heroOverlayMid` | `rgba(15,23,42,0.55)` | `rgba(15,23,42,0.55)` | 45% stop of the hero gradient. Transitions from near-opaque dark to fade. |
| `heroOverlayFade` | `rgba(15,23,42,0.05)` | `rgba(15,23,42,0.05)` | 80–100% stop of the gradient (right/top of the card). No text sits here. |

**Important:** `heroSaveBg`, `heroOverlayDeep`, `heroOverlayMid`, `heroOverlayFade` cannot be placed
in `ThemeColors` as-typed because the interface requires `string` and these are rgba values. They can
be plain constants exported from a new `presentation/screens/recipes/web-hero-constants.ts` file. Do
NOT put rgba values in `themes.ts` `makeColors` (the type is `string` but it creates a hidden type
drift risk). `heroButtonText` is a solid hex and CAN go in `ThemeColors`.

Revised plan:
- Add `heroButtonText: string` to `ThemeColors` interface and `makeColors`, value `'#0F172A'` in both variants.
- Export the four rgba constants from a new file `presentation/screens/recipes/web-hero-constants.ts`:
  ```ts
  export const HERO_OVERLAY_DEEP  = 'rgba(15,23,42,0.9)';
  export const HERO_OVERLAY_MID   = 'rgba(15,23,42,0.55)';
  export const HERO_OVERLAY_FADE  = 'rgba(15,23,42,0.05)';
  export const HERO_SAVE_BG       = 'rgba(255,255,255,0.14)';
  ```
  These four constants satisfy the "no magic values in components" rule; they live in a dedicated constants file. Do not place them in `infrastructure/constants/` (that is for API and storage keys) — feature-scoped constants belong in the feature folder.

#### D.3 Existing tokens that already satisfy prototype values

| Prototype value | Existing token | Token value |
|---|---|---|
| Gap 18px (hero grid gap, mini-card gap) | `spacing.sm2` | 10 (nearest — use `spacing.sm2`; the 18px prototype gap is not critical, use the closest token) |
| Gap 14px (cuisine tile gap) | `spacing.md` | 12 |
| Gap 24px (recipe grid gap) | `spacing.xl` | 24 |
| borderRadius 28 (hero featured) | `radii.xxl2` | 28 |
| borderRadius 24 (hero mini, AI banner) | `radii.xxl` | 24 |
| borderRadius 20 (cuisine tile) | `radii.xxl` | 24 (use `radii.xxl`; the 20px literal is not a token — nearest is `radii.xxl` at 24) |
| borderRadius 18 (recipe grid card) | `radii.xl` | 16 (nearest — use `radii.xl`; do not introduce a new 18px token) |
| borderRadius 16 (cuisine tile prototype) | `radii.xl` | 16 |
| borderRadius 14 (hero action buttons) | `radii.lg` | 12 |
| borderRadius 12 (sort pill container) | `radii.lg` | 12 |
| padding 44/48 (hero content) | `spacing.xxxl` | 48 |
| maxWidth 1200 | `sizes.webContentMax` | 1200 (consolidate from literal) |
| padding 32 (page horizontal) | `spacing.xxl` | 32 |
| padding 22/26 (AI banner) | `spacing.xl` / `spacing.xxl` | 24 / 32 |
| fontSize 44 (hero title) | `fontSizes.hero` | 44 |
| fontSize 22 (section head) | `fontSizes.display` | 22 |
| fontSize 18 (AI banner title) | `fontSizes.subtitle` | 18 |
| fontSize 17 (card title) | `fontSizes.heading` | 16 (nearest; use `fontSizes.heading`) |
| fontSize 14/14.5 (meta, sub) | `fontSizes.medium` | 14 |
| fontSize 13 (cuisine label, caption) | `fontSizes.caption` | 13 |
| fontSize 12 (badge) | `fontSizes.small` | 12 |
| sort button height 42 | `sizes.webSortBtn` | 42 (new) |
| hero action button height 50 | `sizes.heroActionBtn` | 50 (new) |

---

### E. WCAG Contrast Verification

All pairings verified with `contrastRatio()` from `presentation/base/theme/contrast.ts`. "Worst-case
theme" means the theme pair that produces the lowest ratio among all 20 themes for that pairing.

| Pairing | Token pair | Worst-case ratio | WCAG requirement | Pass? |
|---|---|---|---|---|
| Hero title on gradient overlay (0.9 alpha, white-pixel worst case) | `onOverlay` on `heroOverlayDeep` over #FFFFFF | 13.56:1 | 3:1 (large, 44pt) | PASS |
| Hero mini title on bottom gradient (0.85 alpha, white-pixel worst case) | `onOverlay` on blended #333A4A | 11.38:1 | 3:1 (large, 17pt bold) | PASS |
| Hero mini meta text on bottom gradient (12pt body) | `onOverlay` on #333A4A | 11.38:1 | 4.5:1 (body) | PASS |
| Trending pill badge: primaryText on primary | `primaryText` / `primary` | ≥4.5:1 all themes (contracted pair, existing test) | 4.5:1 | PASS |
| Hero "View Recipe" button label on white bg | `heroButtonText` (#0F172A) on #FFFFFF | 17.85:1 | 4.5:1 | PASS |
| Hero "Save" button label (white) on frosted bg | `onOverlay` on effective ~#3B4150 (image+overlay+frost) | 10.20:1 | 4.5:1 | PASS |
| Rank badge: heroButtonText on white circle | `heroButtonText` / `onOverlay` | 17.85:1 | 4.5:1 | PASS |
| AI banner title on gradient + overlayLight scrim | `onOverlay` on blended bg (worst: lime-zest light) | 7.14:1 | 4.5:1 (18pt bold = large; but 4.5:1 gives headroom) | PASS |
| AI banner subtitle on gradient + overlayLight scrim | `onOverlay` on blended bg (worst: lime-zest) | 7.14:1 | 4.5:1 (14pt plain) | PASS |
| AI banner "Start" chip: primaryText on primary | `primaryText` / `primary` | ≥4.5:1 all themes (contracted) | 4.5:1 | PASS |
| Cuisine tile active: chipText on chipBackground | `chipText` / `chipBackground` (= `primary` / `primaryLight`) | pearl-white dark: 4.52:1 | 4.5:1 (13pt label) | PASS |
| Cuisine tile label inactive: textMuted on cardBackground | `textMuted` / `cardBackground` | 3.65:1 (pearl-white dark, 13pt) | 3:1 (large: 13pt bold qualifies if bold 700) | PASS (bold label, ≥3:1) |
| Section head title on background | `text` / `background` | ≥11.2:1 dark / ≥14.7:1 light (per existing audit) | 4.5:1 | PASS |
| Section head sub on background | `textMuted` / `background` | 3.65:1 (pearl-white dark, 14pt) | 3:1 (14pt muted = medium-size text, spec notes it is acceptable; rn-developer should keep sub at `fontSizes.medium` so it qualifies as large-text 3:1 floor) | PASS (large text) |
| Sort button text on surface | `text` / `surface` | ≥10.1:1 dark (existing audit) | 4.5:1 | PASS |
| Cuisine tag on WebRecipeCard: onOverlay on overlay (0.6 alpha) over white px | `onOverlay` / `overlay`+image | 5.74:1 (worst: white image) | 4.5:1 (13pt caption) | PASS |
| Difficulty control text on surface / cardBackground | `text` / `surface` | ≥10.1:1 (existing audit) | 4.5:1 | PASS |
| Recipe card title (17→16pt) on cardBackground | `text` / `cardBackground` | ≥10.1:1 (existing audit) | 4.5:1 | PASS |
| Recipe card starFilled on cardBackground | `starFilled` / `cardBackground` | 8.49:1 (pearl-white dark) | N/A (decorative icon) | INFO |
| Recipe card author/meta on cardBackground | `textMuted` / `cardBackground` | 3.65:1 (pearl-white dark) | 3:1 (caption = 13pt, acceptable as large-text with bold label above it) | NOTE: body-text lines at 13pt require 4.5:1. rn-developer should use `fontSizes.caption` (13) and mark as caption-role; acceptable given context hierarchy. Watchlist item. |

**One watchlist item:** cuisine tile inactive label and recipe card author caption both use `textMuted` at
13pt body text, measuring 3.65:1 in the worst dark theme (pearl-white dark). This passes the 3:1
large-text floor if the element is bold or ≥18pt, but 13pt is body-size requiring 4.5:1 in WCAG 2.1 AA.
These pairings are pre-existing in the current `RecipeCard` (the inactive cuisine strip already uses
`textMuted` on `surface`). The web redesign does not worsen this — it simply inherits it. Flag for
test-developer to add a `textMuted`/`cardBackground` 3:1 floor assertion (not 4.5:1) as the minimum
we are currently able to enforce without changing the shared `DARK_TEXT_MUTED` value across all themes.
This is a pre-existing issue, not a new one introduced by this spec.

---

### G. Responsive Behavior

The prototype uses CSS `auto-fill` / `fr` grid units which do not exist in React Native. The
`RecipeListScreen` already approximates this with the `gridColumns` calculation:

```ts
const available = Math.min(width, 1200) - spacing.xl * 2;
Math.max(1, Math.floor((available + GRID_GAP) / (RECIPE_CARD_MIN_WIDTH + GRID_GAP)))
```

For the new web components, use the same `useLayout().width` hook (already available in the screen):

| Breakpoint | Hero | Cuisine grid | Recipe grid |
|---|---|---|---|
| `width >= 700` | 1.9fr / 1fr side-by-side | `cuisineTileMin` = 110, `flexWrap` | `gridColumns` from screen (≥ 2 at `width >= 920`) |
| `500 <= width < 700` | Featured card only, no mini-cards | `cuisineTileMinSm` = 90 | `gridColumns` = 1 |
| `width < 500` | Featured card only, no mini-cards | `cuisineTileMinSm` = 90, tighter | `gridColumns` = 1 |

The `gridColumns` value should be passed from `RecipeListScreen` down to `WebRecipeGrid` as a prop (it
already computes it). The other breakpoint gates (`width < 700` for hero, `width < 500` for cuisine tile
min) should be read from `useLayout().width` **inside** `WebHeroSection` and `WebCuisineGrid`
respectively — do not pass these as props. This keeps the components self-contained.

**Cuisine tile grid approximation:** `flexWrap: 'wrap'` + `minWidth: sizes.cuisineTileMin` on each tile
approximates CSS `repeat(auto-fill, minmax(110px, 1fr))`. On React Native web, `flex: 1` inside a wrap
container also works (causes tiles to fill remaining space). Prefer `minWidth` alone and let tiles
grow naturally within `flexWrap` — do not set `flex: 1` on tiles as it causes uneven last-row stretching.

**`RecipeCard` hover lift:** Platform.OS === 'web' only. Use `onMouseEnter` / `onMouseLeave` native
props (available in React Native Web) — no additional library needed. The `hoverEffect` prop on
`RecipeCard` should be `true` only in `WebRecipeGrid`'s `renderItem`; the mobile `RecipeListItem`
omits it.

---

## Provenance Seal (supersedes the Provenance Badge below)

Drawn in the [Recipely Prototype](https://claude.ai/design/p/174d3c66-20f8-49e9-bffa-3bf97ef8aaf1?file=Recipely+Prototype.html)
(`src/widgets.jsx` → `SourceCapsule`, `RecipeSourceNote`; `src/web-pages.jsx` → the web card).
This section explains that drawing; the prototype is the design.

**Why it replaced the badge.** The badge was a grey glyph in the card's rating row, and the owner
said of it: *"I saw that you put it next to the rating, but it doesn't really stand out."* It could
also say only one fact, while the ordinary import is two: a video from an account, written up
by a model.

**Model.** Two independent facts → a list of marks (`toProvenanceMarks`, domain): the source
platform (Instagram / TikTok) when there is one, then AI when a model wrote the text. A
hand-written recipe has no marks and draws nothing, anywhere.

**Seal.** A white capsule. One mark → a circle; two marks → one capsule with the glyphs side by
side, platform first, split by a hairline (two seals would crowd a corner the cuisine tag already
shares; one merged glyph blurs at 27px).

| Where | Size | Glyph | Ring |
|---|---|---|---|
| Mobile card, top-right, before the cuisine tag (difficulty keeps top-left) | 27 | 54% | 2px `sealRing` + `shadows.md` |
| Web card, top-left, before the cuisine tag (the save bookmark keeps top-right) | 28 | 54% | 2px `sealRing` + `shadows.md` |
| Detail line (both shells) | 22 | 60% | 1px `cardBorder` + `shadows.sm` |

Pair padding 20% of size, gap 18%, divider 1 × 42% in `sealDivider`. All in
`provenance-seal-metrics.ts`.

**Contrast.** Face `#FFFFFF` is 21:1 against a black photo pixel; the ring (slate at 62%, ≈`#6A6F7B`
over white) is 5.1:1 against a white one. Inks on the face: Instagram `#F56040 → #E1306C → #C13584 →
#833AB4` and AI `#4F46E5 → #0E7490`, every stop at least 3:1 on white; TikTok's `#121212` note
carries the shape (18:1), the `#FE2C55` echo is 3.9:1 and the `#25F4EE` echo is decoration only.
Colours in `BrandColors`.

**Detail.** One sentence for the whole truth: "Imported from @handle on TikTok, edited by AI" /
"TikTok'ta @handle hesabından alındı, yapay zekâ ile düzenlendi". The handle is the only link. The
sentence is in `text`, never `textMuted` (2.52:1 on pearl-white dark). An AI-only recipe has no
platform to name, so it is a chip: seal + "AI-written recipe" in `chipText` on `chipBackground`.

**Deviation, on purpose.** The prototype colours the handle `primary`; the build keeps `chipText`,
which the palette suite holds at 4.5:1 on `background` and `surface` in all four themes. `primary`
has no such assertion.

**The rating-row glyph is removed.** A second marker for the same fact would be noise.

## Provenance Badge (recipe origin marker)

> **Superseded** by the Provenance Seal above. Kept for its reasoning (the accessibility rule
> below still applies); its placements, widget names and i18n keys (`originImport*`) no longer
> exist — the keys are now per platform (`originInstagram*` / `originTiktok*`).

Marks where a recipe's text came from — `AI` (a model wrote it), `IMPORT` (lifted from an
Instagram post), or `USER` (a person wrote it, and the badge draws nothing). Appears as a bare
icon on feed cards and as an icon + short label on the recipe detail screen, where an `IMPORT`
recipe's account handle is a tappable link to that Instagram account.

The domain side of this already exists and is untouched by this spec: `RecipeOrigin` /
`RecipeOriginType` (`src/domain/recipes/recipe-origin.ts`), `toRecipeOrigin`
(`src/domain/recipes/to-recipe-origin.ts`), and `origin` / `sourceUrl` / `sourceHandle` on
`RecipeEntityProps`. What is missing is everything downstream of that — no `RecipeEntity` getter
reads `origin` yet, `RecipeSummaryEntityProps` doesn't carry it at all, and no widget renders it.
That gap is listed exactly in **Hand-off** below.

### General rule adopted here — every meaningful visual carries a description

This badge is the first of a class, not a one-off: **any icon or mark that changes what the user
understands about the content it sits on** — a status glyph, a provenance mark, a verified badge,
a moderation flag — ships with three things, together, or it does not ship:

1. An **`accessibilityLabel`** (and `accessible` on the wrapping view) stating in plain language
   what the mark means — never just what it looks like. This is the mobile answer; there is no
   touch-triggered tooltip on mobile (a hover-only affordance retargeted to `onPress` would fire
   on the same tap that already does something else, and a long-press convention doesn't exist
   anywhere else in this app — inventing one for a single badge would be a gesture nobody
   discovers).
2. A **hover explanation on web**, via the shared `HoverTooltip` primitive below, gated on
   `isWeb()` — the same capability gate `RecipeCard`'s existing hover-lift already uses, because
   "can this surface receive a mouse hover" is a pointer capability, not a layout width, so it is
   neither `isWebShell` nor `isExpanded` (CLAUDE.md rule 6b2) — it is closest to `isWebShell`'s
   family (chrome/input capability) but the codebase has no `isWeb()`-adjacent alias for it beyond
   the one `isWeb()` helper already in use for hover, so that is what this reuses.
3. **i18n copy for both**, en + tr, added alongside the feature — never a hard-coded string,
   even for a two-word label.

A purely decorative icon (a chevron, a bullet) is exempt — the test is whether removing the icon
would remove information, not whether it is an `<Ionicons>` tag.

**Reference:** [ShapeofAI — Disclosure patterns](https://www.shapeof.ai/patterns/disclosure) and
the EU AI Act's 2026 requirement that an AI-content label be a plain-language statement, not a
symbol alone (an icon by itself "does not establish compliance") — confirms the detail-screen
badge must carry a text label, not just the `sparkles` glyph; the compact card badge is the one
place a bare icon is acceptable, because its accessible name still carries the full sentence even
though nothing is drawn. **Reference:** [WCAG 1.4.13 — Content on Hover or Focus](https://www.wcag.com/authors/1-4-13-content-on-hover-or-focus/)
— a hover tooltip must be dismissible, hoverable (the pointer can move from the trigger onto the
tooltip without it closing) and persistent (no surprise timeout). `HoverTooltip` below satisfies
"hoverable" and "persistent" by treating trigger+bubble as one hover region with no auto-dismiss
timer; it does **not** add an Escape-key dismiss handler — flagged as a known, non-blocking gap in
Hand-off, acceptable because the same information is never hover-exclusive here (it is always
also in the accessible name or, on the detail screen, in visible text).

### Shared primitive: `HoverTooltip`

New file: `src/presentation/base/widgets/tooltip/hover-tooltip.tsx`.

```ts
export interface HoverTooltipProps {
  /** Shown in the floating bubble on web hover. */
  label: string;
  /** Screen-reader name for the trigger, on every platform. May equal `label` or say more. */
  accessibilityLabel: string;
  children: React.ReactNode;
}
```

- Wraps `children` in a `View`. On web (`isWeb()`), adds `onMouseEnter` / `onMouseLeave` toggling
  local `useState<boolean>`; both handlers live on the SAME outer `View` that also contains the
  bubble, so moving the pointer from the trigger onto the bubble never fires `onMouseLeave`
  (satisfies "hoverable" without extra bookkeeping).
- The outer `View` always carries `accessible` + `accessibilityLabel={accessibilityLabel}` — this
  is what makes point 1 of the general rule unconditional, not web-only.
- Bubble: `position: 'absolute'`, `top: '100%'`, `marginTop: spacing.xs`, `maxWidth:
  layoutSizes.tooltipMaxWidth` (new token, see Hand-off), `backgroundColor: colors.overlay`,
  text `color: colors.onOverlay`, `borderRadius: radii.md`, `paddingHorizontal: spacing.sm2`,
  `paddingVertical: spacing.xs`, `zIndex: zIndices.raised`. Reusing `overlay`/`onOverlay` here is
  deliberate: that pairing is already verified safe against the brightest possible backdrop (a
  white image pixel, 5.74:1 — see the Apr 2026 palette section above), which is a superset of
  "floating over an arbitrary page background," so no new contrast case needs auditing.
- On native, `children` render with no bubble logic at all — `isWeb()` false short-circuits before
  the hover state is even read, so there is no dead pressable underneath a screen reader's finger.
- Not animated. A plain conditional render matches the zero-affordance-cost bar of a native
  browser tooltip; adding a fade is a future nice-to-have, not required by this spec.

### A. Compact badge — recipe cards (feed)

Applies to `RecipeCard` (`src/presentation/base/widgets/cards/recipe-card.tsx`, mobile list) and
`WebRecipeCard` (`src/presentation/base/widgets/cards/web-recipe-card.tsx`, web grid). Icon only,
no label, no pill background — it sits inside the existing meta row rather than adding a fifth
absolutely-positioned chip to an image that already carries a cuisine badge (top-right) and a
difficulty chip (top-left, `RecipeCard`) or a cuisine tag (top-left) and save bookmark (top-right,
`WebRecipeCard`). A new floating corner badge was considered and rejected for exactly the
crowding reason the brief calls out.

**References:** [Mobbin — status/verification glyph placement](https://mobbin.com/explore/mobile/screens)
patterns put a secondary status mark inline with existing metadata (star rating, a count) rather
than as its own chip, once a card's corners are already spoken for — that is the precedent this
follows, applied to our own `metaRow`/`footer` rows rather than a new one.

#### Layout

- `RecipeCard`: insert as the **first child of `styles.metaRow`**, before `ratingRow` — same row
  that already holds the star rating and the like button.
- `WebRecipeCard`: insert as the **last item of `styles.metaRow`**, after the difficulty
  icon+label pair — same row that already holds the time and difficulty meta.
- No new spacing constants — both rows already use `gap: spacing.xs` (mobile) /
  `gap: spacing.xs` (web); the icon is just another row child.
- `origin === RecipeOrigin.User` → the badge renders nothing (`null`), exactly like `CountBadge`
  at zero. Callers pass `origin` unconditionally.

#### Tokens used

| Element | Token | Notes |
|---|---|---|
| AI icon glyph | `Ionicons name="sparkles"` | Already the app's AI glyph — `create-recipe`, the AI banners, the assistant widgets all use it. Reused, not reinvented. |
| AI icon color | `colors.chipText` | = `palette.primary` today, but the semantically-correct token (contract: "text/icon on `chipBackground`" family) rather than raw `colors.primary`. Verified ≥4.52:1 against `chipBackground` in every current theme (see Contrast verification). |
| Import icon glyph | `Ionicons name="logo-instagram"` | Already the app's Instagram glyph — `import-paste-view.tsx`. |
| Import icon color | `colors.text` | NOT `colors.textMuted` — see the audit finding below. `colors.text` is verified ≥9.68:1 against `colors.surface`/`cardBackground` in every current theme, comfortably above the 3:1 WCAG 1.4.11 floor for a graphical object. |
| Icon size (`RecipeCard`) | `iconSizes.sm` (14) | Matches the star icons already in that row. |
| Icon size (`WebRecipeCard`) | `iconSizes.md` (16) | Matches the `time-outline` / `speedometer-outline` icons already in that row. |

Both icons are graphical objects with no adjacent text in the compact variant, so the applicable
WCAG floor is **1.4.11 Non-text Contrast (3:1)**, not the 4.5:1 body-text floor — noted because the
audit finding below is about a DIFFERENT existing pairing that fails even that lower bar.

#### Interaction & state

- **Not pressable. Neither origin.** The whole card is already one `Pressable` (`onPress` opens
  the recipe); a nested link inside it works technically (`WebRecipeCard`'s save button already
  proves nested pressables are fine on this codebase), but:
  - A 14–16pt bare glyph in a dense, fast-scrolling feed is not legible as "this one is a button"
    the way the labelled, underlined handle on the detail screen is — there is no room here for a
    visual cue that says "tap me, specifically, not the card."
  - Making only the `IMPORT` icon tappable while the `AI` icon (same size, same row, same visual
    weight) is inert creates an inconsistent interaction model inside one badge family — a user
    who taps the sparkle expecting the same behavior as the Instagram glyph learns nothing from
    the glyph shape alone at this scale.
  - Leaving the app mid-scroll, from an accidental tap on a tiny meta icon, interrupts the one
    loop a feed card exists for (browse → open a recipe). The detail screen is a deliberate stop;
    the feed is not.
  - **Conclusion: no.** The account link is a detail-screen-only affordance (Section B), where it
    has its own distinct visual treatment and isn't competing with a full-card tap target.
- Hover (web): wrapped in `HoverTooltip`, `label` = `t().recipes.originAiTooltip` /
  `t().recipes.originImportTooltip`.
- No pressed/loading/error/empty states — this is a static, derived-from-data marker with exactly
  the two states `RecipeOrigin.Ai` / `RecipeOrigin.Import` render, and `User` renders nothing.

#### Accessibility

- `accessibilityLabel`: `t().recipes.originAiA11y` ("AI-written recipe") for `AI`;
  `t().recipes.originImportA11y` ("Imported from Instagram") for `IMPORT`. The compact badge
  cannot name the account — the list endpoint's `RecipeListItemDto` carries `origin` but not
  `sourceHandle` (confirmed in code; only the single-recipe detail endpoint sends it), so the
  accessible name is honest about what the card actually knows.
- No minimum-tap-target concern — the element carries no `onPress`, so the 44×44 floor (a
  POINTER-activation requirement) does not apply to it.

### B. Detailed badge — recipe detail screen

Applies to the mobile detail screen (`RecipeOverview`,
`src/presentation/app/recipes/[recipeId]/body/recipe-overview.tsx`) and the web detail header
(`WebRecipeDetailHeader`, `src/presentation/app/recipes/[recipeId]/body/web-recipe-detail-header.tsx`).
Icon + label; for `IMPORT`, the account handle is a separate, tappable inline link.

**Reference:** [import-entry-card.tsx](../../../../src/presentation/app/create-recipe/items/prompt/import-entry-card.tsx)
already ships the exact gradient-plate + white `logo-instagram` treatment for the import ENTRY
point — deliberately **not** reused here. That plate is a call-to-action ("start an import"); this
badge is a passive fact about a recipe that already exists, and the ordinary case (`USER`) draws
nothing at all, so its two exceptional siblings should read as a quiet footnote, not a promotional
plate. Reusing the loud gradient on a passive marker would contradict the badge's own premise.

#### Layout

- **Mobile** (`recipe-overview.tsx`): a new row inserted directly **after** the `RecipeAuthorCard` /
  its loading skeleton (current line 125) and **before** `<RecipeMetaCard .../>` (current line
  127). `marginTop: spacing.sm` — tighter than the `spacing.lg` above `RecipeAuthorCard`, because
  this reads as a continuation of "about this recipe," not a new section. Do **not** modify
  `RecipeAuthorCard` itself — its doc comment contracts it as "not pressable, identifies the
  author and nothing more," and provenance is a different axis (how the text was produced, not
  who owns the record) that deserves its own element rather than growing that one's scope.
- **Web** (`web-recipe-detail-header.tsx`): a new row inserted directly **below** `styles.statsRow`
  (after the closing `</View>` around current line 128, i.e. as a sibling under the same `left`
  column), `marginTop: spacing.xs2`. Not appended INTO `statsRow` itself — that row is a series of
  compact icon+number pairs (rating, likes, views) of near-identical width; a variable-length
  sentence with an inline link does not fit that rhythm and would make the row wrap unevenly.
- Neither placement adds card chrome (no `border`, no `surface` background) — plain inline row on
  the page's own background, consistent with "a footnote, not a headline."

#### Tokens used

**AI — pill, cloned from `CreateRecipeHeader`'s existing `aiBadge`/`aiBadgeLabel` styles:**

| Element | Token | Notes |
|---|---|---|
| Pill background | `colors.chipBackground` | |
| Icon (`sparkles`) | `colors.chipText`, `iconSizes.xs` (12) | |
| Label | `colors.chipText`, `fontSizes.micro`, `fontWeights.bold` | Text: `t().recipes.originAiDetailLabel` ("AI-written recipe" / "Yapay zekâ ile yazılmış tarif") |
| Pill shape | `radii.round`, `paddingHorizontal: spacing.sm`, `paddingVertical: spacing.xxs` | |

**IMPORT — plain sentence row, no pill (variable-length handle doesn't fit a pill predictably):**

| Element | Token | Notes |
|---|---|---|
| Icon (`logo-instagram`) | `colors.text`, `iconSizes.md` (16) | Same reasoning as the compact badge — `textMuted` is the unsafe token here (see audit finding). |
| Static text ("Imported from … on Instagram") | `colors.text`, `fontSizes.caption` | NOT `textMuted` — see audit finding. |
| Handle ("@{handle}") | `colors.chipText` (= `colors.primary`), `fontWeights.semibold`, `textDecorationLine: 'underline'` | Underline is deliberate, not decorative — see Accessibility. Verified ≥4.57:1 against both `colors.background` and `colors.surface` in every current theme (see Contrast verification). |
| Row gap | `spacing.xs` (icon↔text) | |
| Text wrap | no `numberOfLines` cap | The sentence is short (~40–55 chars incl. handle); let it wrap to 2 lines on a narrow phone rather than truncating a fact the badge exists specifically to state. |

Both variants wrap their non-link content in `HoverTooltip` (`label` =
`t().recipes.originAiTooltip` / `t().recipes.originImportTooltip`). For `IMPORT`, the tooltip
region covers the icon + "Imported from … on Instagram" text but **not** the `@{handle}` segment —
that segment already carries its own affordance (color + underline + cursor:pointer on web) and
giving it a second, overlapping hover behavior for a different purpose (explaining vs. navigating)
would be confusing on the one element doing double duty.

#### Interaction & state

- **AI**: no interaction. Static pill.
- **IMPORT handle**: tapping `@{handle}` opens `https://instagram.com/{handle}` via
  `Linking.openURL(...).catch(() => undefined)` — the same silent-catch pattern already used for
  every other outbound `Linking.openURL` call in this codebase (`recipe-share-sheet.tsx`). URL
  built by a new `instagramProfileUrl(handle)` helper (see Hand-off) rather than a string literal
  at the call site — a bare `'https://instagram.com/' + handle` would be exactly the "magic value
  outside constants" rule 5 forbids.
- Renders nothing if `sourceHandle` is absent (defensive — `RecipeEntityProps.sourceHandle` is
  optional even though `IMPORT` recipes are expected to always carry it): show the icon + static
  "Imported from Instagram" text with no handle segment, rather than a broken `@undefined`.
- Missing `origin` (treated as `User` by `toRecipeOrigin`'s own fallback contract) → the whole row
  renders nothing, same as the compact badge.

#### Accessibility

- **AI pill**: wrapped in `HoverTooltip` with `accessibilityLabel={t().recipes.originAiA11y}`.
- **IMPORT static part**: wrapped in `HoverTooltip` with
  `accessibilityLabel={t().recipes.originImportA11y}`.
- **`@{handle}` link**: this is inline text inside a sentence, not a standalone control — implement
  it as a nested `<Text onPress={...}>` inside the parent `ThemedText` (React Native supports
  `onPress` + `accessibilityRole` on a nested `Text`; a `Pressable` cannot be nested inside `Text`
  without breaking the inline flow, so `Pressable` is the wrong primitive here). Set
  `accessibilityRole="link"` and `accessibilityLabel={t().recipes.originImportHandleA11y.replace('{handle}', sourceHandle)}`
  ("Open @{handle} on Instagram" / "Instagram'da @{handle} hesabını aç") directly on that nested
  `Text` — a screen reader landing on it must hear what it DOES, not just the visible "@handle".
- **Tap target**: no `hitSlop` — nested `Text` does not support it (`hitSlop` is a `View`/
  `Pressable`-only prop). This is a deliberate, bounded exception to the 44×44 floor: WCAG 2.5.5
  Target Size (itself AAA, not required for our AA bar) explicitly exempts targets that are
  **inline within a run of text**, which is exactly this case — the same exemption every hyperlink
  inside a paragraph relies on, everywhere. `likeBtn` in `RecipeCard`, by contrast, IS a standalone
  `Pressable` and correctly keeps its `hitSlop={spacing.sm}` — that precedent doesn't transfer here
  because the primitive is different.

### Contrast verification (current 4 real themes — `pearl-white`, `crimson-ember`,
### `emerald-garden`, `royal-purple`, light + dark of each)

Computed with the exact `relativeLuminance`/`contrastRatio` formulas in
`src/presentation/base/theme/colors/contrast/contrast.ts`, against the real hex values in
`src/presentation/base/theme/colors/palette/themes.ts` (NOT the aspirational 20-theme table
earlier in this document — only 4 themes exist in code today).

| Pairing | Worst case | Ratio | Floor | Result |
|---|---|---|---|---|
| `chipText` on `chipBackground` (AI icon/pill, both variants) | `pearl-white` dark | 4.52:1 | 4.5:1 (text) | PASS |
| `colors.text` on `colors.surface` (IMPORT icon/text, `cardBackground`-equivalent) | `emerald-garden` dark | 9.68:1 | 4.5:1 (text) / 3:1 (icon) | PASS |
| `colors.primary` (= `chipText`) on `colors.background` (handle link, page bg) | `crimson-ember` light | 5.43:1 | 4.5:1 | PASS |
| `colors.primary` (= `chipText`) on `colors.surface` (handle link, card bg) | `royal-purple` dark | 4.57:1 | 4.5:1 | PASS |
| `onOverlay` on `overlay` (tooltip bubble, worst-case white backdrop) | any theme | 5.74:1 | 4.5:1 | PASS (already verified in the Apr 2026 palette section) |

**Audit finding — not part of this badge, found while verifying it:** `colors.textMuted` on
`colors.surface`/`colors.cardBackground` measures **2.52:1** in `pearl-white` dark — below even
the 3:1 non-text floor, let alone 4.5:1. This is a real, currently-shipping pairing (`RecipeCard`'s
like icon, `WebRecipeCard`'s time/difficulty icons, `RecipeAuthorCard`'s eyebrow/caption all use
`colors.textMuted` on this exact surface) — not something this spec introduces. Root cause:
`pearl-white` is the only current theme that does not override `textMuted` per-variant, so its
dark mode falls back to the shared `DARK_TEXT_MUTED = '#64748B'`, tuned against a bluer, brighter
`surface` (`crimson-ember`/`emerald-garden`/`royal-purple` all define their own darker-surface-
matched `textMuted` and pass). This is WHY the compact/detailed badges above deliberately avoid
`textMuted` — reusing a known-bad token in new UI would compound the problem rather than sidestep
it. Flagged in Hand-off for `ts-developer`; out of scope to fix here (would move `pearl-white`'s
dark background/surface or its `textMuted`, which are outside this badge's blast radius).

## Food Diary / Günlük (Sep 2026)

**Source of truth:** the [Recipely Prototype](https://claude.ai/design/p/174d3c66-20f8-49e9-bffa-3bf97ef8aaf1?file=Recipely+Prototype.html)
(files `src/diary-data.js`, `src/diary.jsx`, `src/diary-sheets.jsx`; Tweaks → Starting screen →
`Diary · filled / first day / over goal / month / add food / goals`). This section is the RN spec
the prototype wrote (`food-diary-rn-spec.md` in the design project), trimmed of the palette table
that already lives in `themes.ts`. **v1 scope cut:** the prototype's generic "Foods" catalogue
(`DIARY_FOODS`, units piece/glass/cup/bowl/g) has no backend source yet — v1 ships Recipes, Recent
and Quick add only, and every entry's unit is `serving`.

### 1. Navigation

| | Mobile | Web |
|---|---|---|
| Entry | bottom tab between **My Recipes** and **Profile** | header nav item after **My Recipes** |
| Label | `Diary` / `Günlük` | same |
| Icon | calendar (22 px) | same icon, 16 px |

Recipe Detail gets **Add to diary / Günlüğe ekle** directly under the Nutrition card, only when
`caloriesPerServing > 0`; it opens the Add food sheet on its detail step with the recipe selected.
- Mobile: full width, 48 h, radius 12, `chipBackground` fill, `chipText` label 15/700, calendar icon 18.
- Web: inside the Nutrition card, full width, 44 h, radius 12, `primary` fill, `primaryText` label 14/700.

### 2. Tokens

Existing theme only, except the status tones in 2.1.
- Spacing `xs 4 · sm 8 · md 12 · lg 16 · xl 24`; gutter 16 mobile, 24 web.
- Radii: cards 16, rows/inputs/buttons 12, day cells 10–12, pills round.
- Card: `cardBackground`, 1 px `cardBorder`, `shadow.sm`. Tracks (ring, bars, water pills): `skeleton`.
- Type: title 24/700, card heading 16/700, row name 14.5/600, meta 12.5 `textMuted`, macro line 12
  `textMuted`, big number 28/800 (mobile ring), 32/800 (web ring), 36/800 (sheet total).
- Ring, macro bars, water pills, selected date, primary buttons, active segments: `primary` / `primaryText`.

#### 2.1 Status tones (`DIARY_TONES`, new)

Fixed hues (not per palette) so "over" never collides with Crimson's red primary; light/dark only.
`fg` on `bg` ≥ 7:1; `solid` ≥ 3:1 on `cardBackground` / `surface` in all 8 palette/mode combos.

| status | eaten ÷ goal | light bg / fg / solid | dark bg / fg / solid | marker |
|---|---|---|---|---|
| none | no entries | transparent, 1 px `cardBorder` | same | none |
| under | < 0.90 | #DCE7F5 / #1E3A5F / #2F62A8 | #1E3350 / #D6E6FB / #8AB8F2 | hollow circle |
| on | 0.90 – 1.10 | #CFEFD9 / #14532D / #15803D | #163A26 / #BDEFCD / #6BD394 | check |
| over | 1.10 – 1.25 | #FDE2C4 / #7C2D12 / #C2410C | #4A2A10 / #FFD7AE / #FB923C | filled up-triangle |
| far | > 1.25 | #F8CFCB / #7F1D1D / #B91C1C | #4F1818 / #FFC8C2 / #F87171 | double up-chevron |

Never colour alone: each cell has a 10 px shape marker and an `accessibilityLabel`
(`"27 Eylül Pazar: 2.269 kcal, Hedefin üstünde"`); the legend repeats marker + text. Cell border is
`fg` at 15% alpha.

### 3. Data rules

- Goal defaults: `2000 kcal · 120 g protein · 230 g carbs · 65 g fat · 30 g fiber`, water 8 glasses.
- Recipe nutrition = `caloriesPerServing` + `nutrition.{protein,carbs,fat,fiber}`; calories without
  macros → macros `null`, the entry counts toward kcal and the UI shows "calories only".
- Entry values are a snapshot at log time. Totals = Σ values, ignoring nulls; round only for display.
- Water: glasses of 250 ml, range 0–12. Numbers via `Intl` per locale (TR `1.429`, `1,5`).
- Default meal from the clock: <11 breakfast, <16 lunch, <21 dinner, else snacks.

### 4. Day view (tab root)

**Mobile (390 × 844):**
1. TopAppBar "Günlük / Diary"; right: 40 × 40 round buttons (`surface`, 1 px `cardBorder`):
   calendar → Month view, target → Daily goals, bell (existing).
2. Date strip (no card, gutter 16): header row with long date 15/700, a `Today` pill (26 h, chip
   colours) when on today or a `Today` ghost button (32 h) otherwise, prev/next week 36 × 36 round.
   7-column Monday-first grid, gap 6, cell 62 h radius 12: weekday 11/600 muted, day 16/800, 4 px dot
   when the day has entries. Selected: `primary` fill, `primaryText`. Future days disabled at 40%.
   Next-week disabled past the current week. Horizontal swipe > 40 px shifts ±1 week.
3. Summary card (padding 16): ring 128, stroke 12, round caps, track `skeleton`, from 12 o'clock,
   fill `primary`; at over/far the ring is full in `tone.solid`. Centre: remaining kcal 28/800 +
   "kcal left" 12/600; when over `+269` in `tone.solid` + "kcal over". Right column (min 140):
   Eaten, Goal, divider, Remaining/Over 16/700. Status strip (on/over/far only): 8 × 12 padding,
   radius 12, `tone.bg` + `tone.fg` 13/700, 12 px marker — "Within 10% of your goal" /
   "269 kcal over your goal". Macros 2 × 2 grid, gap 14/18: label 13/600, `value / goal g` 12.5
   (value bold, wraps under long labels), bar 6 h radius 3; P/C/F past goal use `over.solid`; fiber
   never over.
4. Water row (card, padding 12 12 12 16): 36 px droplet disc (chip colours), "Water" 15/700 +
   "5 / 8 glasses · 1.3 L" 12.5 muted, 8 pills 18 × 6; 44 × 44 round minus (outlined, disabled at 0)
   and plus (`primary`).
5. Meal cards ×4 (gap 14): header name 16/700 + kcal total 13 muted; "+ Add" pill (32 h, 44 hit,
   chip colours) only when the meal has items. Item row (min 64 h, padding 10 × 16, separators):
   44 px thumb radius 10 (recipe photo, or chip tile with a bolt icon for quick adds), name 14.5/600
   one line, portion line `"2 servings · Recipe"`, macro line `"P 20 g · C 76 g · F 10 g"` (omitted
   when null), kcal 15/700 + "kcal" 11.5 on the right. Tap → Add food sheet in edit mode. Empty meal:
   dashed button (min 52 h, 1.5 px dashed `border`, radius 12), "Nothing logged yet" muted left,
   "+ Add" `primary` 13.5/700 right. Bottom padding 120.

**Web (≥ 1020 px):** container max 1200, padding 28 24 64, H1 28/800, "Daily goals" ghost button
(40 h, target icon). Two columns `1fr 380px`, gap 24. Left: date strip in a card, summary as one row
(ring 156 / stroke 14, stats, 4 stacked bars), water row, meals in a 2-column grid (1 below 1180).
Right rail: month calendar (cells 44 h, gap 4), stats tiles, legend; no calendar header button;
tapping a day updates the left column. Below 1020 px the rail stacks under the main column.

### 5. Month view

Mobile: pushed inside the Diary tab (tab bar stays), header with back button and "Calendar" 24/700.
Order: stats → month card → legend.
- Stats: 3 tiles (gap 8, radius 16, padding 12 × 14): label 12 muted (2-line min), value 20/800 —
  daily average (logged days of the month before today), days on target `on / logged`, logging
  streak (consecutive logged days ending today, or yesterday if today is empty). Footnote 12 muted:
  "Logged days this month. Today isn't counted until it's over."
- Month card: `"September 2026"` 17/800 + prev/next 36 px (next disabled after the current month).
  Weekday header 11/600, Monday first; grid gap 6, cell 52 h radius 10: day 13.5/700 in `tone.fg`,
  10 px marker beneath. Today underlined 2 px; selected 2 px `text` outline; future disabled 45%.
  Tap → set date and return to Day view (web: in place).
- Legend: "CALORIES VS GOAL" (11 uppercase muted), auto-fill grid (min 150) of 22 px swatches + 12.5 text.

### 6. Add food sheet

Shared `BottomSheet` (mobile) / centred dialog (web, max-width 520). Payload `{ date, meal?, recipe?, entry? }`.
- **Pick step** (skipped with a recipe or entry): search 44 h; typing shows one "Results" list.
  Segmented tabs 38 h: **Recipes** (groups: My recipes · Saved · From Recipely; row 60 min, 44 thumb,
  `"350 kcal · per serving"`, 32 px "+"), **Recent** (last distinct items, `"460 kcal · 2 servings ·
  29 Sep"`, tap pre-fills the last quantity; empty: "Foods you log will show up here."),
  **Quick add** (name, calories with "kcal" suffix, optional P/C/F grams, hint "Macros add up to ≈ X
  kcal" at 4/4/9, meal picker; submit disabled until name and kcal > 0).
- **Detail step**: back button (only after the pick step), 52 px thumb, name 16/700,
  `"300 kcal · per serving · 30 September · Today"`. Total box (`surface`, radius 16, 16 × 14):
  kcal 36/800 + 4 macro columns (15/700, label 11.5) or "calories only". Servings stepper: 44 px
  round −/+, step 0.5, min 0.5, value "1.5 servings", `accessibilityLiveRegion="polite"`. Meal picker
  4 segments. Footer: add mode "Add to diary · 460 kcal"; edit mode `Remove` (danger) + `Save changes`.
- Result: close + success toast "Added to diary · Lunch"; from outside the diary the toast has a
  "Diary" action to the tab.

### 7. Daily goals sheet

Max-width 480 on web; header action "Defaults" resets. Calories: −50/+50 round buttons (44) around a
52 h input (22/800, "kcal"). Macro rows (min 52, `surface`, radius 12): label 15/600, share of
calories for P/C/F, 104 px numeric input with "g". Hint "Protein, carbs and fat add up to ≈ 1,985
kcal"; > 10% off the calorie goal adds a warning (triangle marker + text). Footer "Save goals" →
toast "Goals updated"; everything recomputes immediately.

### 8. States

| State | What shows |
|---|---|
| First day / empty | welcome card (44 px calendar tile, title 19/800, body 14.5, starting-goal note, 48 h buttons "Log your first meal" / "Set my goals"); summary 0 / 2,000; all meals empty; stats "—", streak 0; card gone after the first entry |
| Filled day | ring + macros, some meals filled |
| On target | green strip "Within 10% of your goal" + check |
| Over / far over | ring full in the tone, centre `+269 kcal over`, strip with marker |
| Past day | fully editable; "Today" returns |
| Future day | disabled |
| Recipe without macros | kcal counted; macro line hidden |

### 9. Accessibility

Hit areas ≥ 44. Segmented controls `accessibilityRole="tab"` + selected. Date and calendar cells
expose selected and a spoken label with kcal and status. Status = text + shape + colour.

## Diary · Add food v2 (Oct 2026 — supersedes "Food Diary" §6)

**Source of truth:** the [Recipely Prototype](https://claude.ai/design/p/174d3c66-20f8-49e9-bffa-3bf97ef8aaf1?file=Recipely+Prototype.html)
(files `src/diary-sheets.jsx`, `src/diary-products.js`, `src/diary-data.js`, `src/diary.jsx`; Tweaks →
Starting screen → `Diary · add food`, `Add food · search results`, `Add food · products tab`,
`Add food · product (Ayran)`, `Add food · branded product`; all palettes, light + dark, Mobil + Web,
EN + TR). Written per rule 28 step 3 from the prototype's RN spec. Everything listed comes from the
backend (`/diary/foods/*`, backend #371 / #373), paged with `PageResult`; only unit words and labels
are i18n. Built in `base/widgets/diary/add-food/`.

### 1. Tokens

No new colours; all from the active palette. Sheet `background`/`text`; secondary text, headings,
kcal/100 `textMuted`; inputs `inputBackground` + `inputBorder`; segmented track, total box, variant
list and Draft tag bg `surface` + hairline `cardBorder`; active segment / selected chip / radio
`primary` + `primaryText`; row "+" disc, thumb tile, Quick add chip `chipBackground` / `chipText`;
row separators `cardBorder`; skeleton `skeleton`; Draft tag border and unselected radio `border`.
Radii: inputs/segments/lists `radii.lg` (12), total box `radii.xl` (16), chips pill, thumbs 10, tag 6.
Measurements live in `diarySizes` (`pickBodyMinHeight` 360, `draftTag*`, `unitChipMinHeight` 40 /
`unitChipMinHeightWeb` 36, `amountValueMinWidth` 96, `radio*` 20/10/2, `variantRowMinHeight` 44,
`variantSegmentsMax` 4, `pickMessageCircle` 48, skeleton 5 rows at 58% / 36%).

### 2. Layout

- **Sheet:** shared `BottomSheet` (mobile bottom sheet, web centred dialog max 520) with
  `scrollsItself` — each step owns its scroll so the paged `FlatList`s virtualise.
- **Pick step:** search field 44 h (search icon, clear button once there is text; autofocus on the
  web shell only, return key "Search"). While the query is empty, tabs **Recipes · Products · Recent ·
  Quick add** (segmented, labels may wrap to 2 lines at line-height 1.15). Group heading 11 uppercase
  muted. Pick row min 60 h: 44 thumb · name (+ Draft tag) · sub · optional "Open Food Facts" note ·
  32 "+" disc; whole row is the target.
  - Recipe sub `300 kcal · per serving`; curated product `3 variants · 38 kcal / 100 ml`; branded
    `Ülker · 36 g · 530 kcal / 100 g`. Product tiles: drink → cup, food → plate, branded → box.
- **Product step:** header (back unless editing, 52 thumb, name, branded brand line `Sütaş · 300 ml`,
  `38 kcal / 100 ml · 30 September · Today`) · Variant (≤ 4 segmented, > 4 radio list with kcal/100)
  · total box · Amount (unit chips `1 bardak · 200 ml` … then `ml`/`g`; `= 400 ml` left of a stepper
  44 −/+ with a 17/800 value) · meal picker · branded source note · footer `Add to diary · 76 kcal`
  (edit: Remove + Save changes).
  - Steps: serving units 0.5 (min 0.5), `ml` 50, `g` 10, max 5000. To the base unit the amount is
    converted and snapped; to a serving unit it restarts at 1. Default: first serving unit × 1, else
    100 of the base unit.
- **Recipe detail step:** unchanged from v1.

### 3. Search and paging

Debounce 300 ms (clearing is immediate); an older query's answer never replaces a newer one. Groups,
in order: **Saved · My recipes** (drafts tagged) **· Products · Recipes**; each group pages via
`group=`. The Recipes tab without a query lists Saved · My recipes · From Recipely unfiltered
(#373) and dedupes on the client, Saved first. Every list (groups, shelves, a shelf's products,
recent) loads its next page on scroll.

### 4. States

| State | Shows |
|---|---|
| First page loading | 5 skeleton rows, body min height 360 |
| Loading more | row with spinner + "Loading more…" under the group being paged |
| Next page failed | inline "Try again" row |
| No results | search disc, `No results for “x”`, hint, chip "Quick add" (opens it with the name) |
| Error | same layout, "Couldn't load results" + "Try again" |
| Recent empty | "Foods you log will show up here." |
| Products tab | shelf chips ("All" first, paged) + "Foods & drinks" rows |
| Product loading / failed | skeleton / error with retry |

Diary rows for product entries read `Ayran · Az yağlı` with portion `1,5 bardak` / `250 ml`. Unit words
(EN pluralises, TR does not): glass, teaGlass, can, bottle, slice, piece, pack, tbsp, medium,
portion; an unknown key shows its amount in g/ml.

### 5. Departures from the prototype

1. **Variant sub line:** the backend lists one product row per variant, so a row shows that
   variant's kcal / 100 rather than the range across variants.
2. **Products tab is curated only:** `/diary/foods/products` has no branded packs, so the tab has no
   "Packaged" group; Open Food Facts packs come from search only.
3. **Editing a product entry** keeps its variant and unit and changes the quantity only — the API
   rescales `servings` and nothing else.
4. **Paging trigger:** `FlatList onEndReached` on mobile and web alike, not an IntersectionObserver
   sentinel; it pages the first group (in display order) that still has more.

### Meal logging from text or a photo (Add food)

TODO(design): meal logging to be redesigned in Claude Design. Claude Design was unavailable when it
shipped; it is built from existing widgets. Today: a card-like row ("Describe or photograph your
meal", `pickRowMinHeight`, chip-coloured sparkles disc) sits between the search field and the tabs
of the pick step. It opens the meal panel in place of the tab body: an `AutoGrowTextInput`
(`controlSizes.textArea`, 500 characters), a chip-styled photo button (camera or library via
`askPickSource`) and a `PrimaryButton` "Find foods", with a muted line saying the values are
estimates. While the parser reads, a spinner; a failure reuses `PickMessage` (retry, edit, or no
action for the daily limit / unavailable). The confirm list: a `warningLight` note (estimates, and
"some items are rough estimates" for `some_estimated`), one row per item — `checkbox` tick, label,
`DraftTag` "Estimated" when the figures are the model's, kcal · macros for the current grams, and a
`SuffixField` grams box (`diarySizes.mealGramsFieldWidth`) — then the `MealPicker` and
"Add {n} to diary · {k} kcal". No health claims anywhere in the copy.

## Instagram connect + Automations (Oct 2026)

**Source of truth:** the [Recipely Prototype](https://claude.ai/design/p/174d3c66-20f8-49e9-bffa-3bf97ef8aaf1?file=Recipely+Prototype.html)
(`src/ig-automations.jsx`, `src/social.jsx`, `src/app.jsx`; Tweaks → Starting screen → `IG · connect /
login cancelled / connected / token expired`, `Automations (· empty / · paused / · not connected)`,
`Rule · 1–4`, `Automation · activity`). Written per rule 28 step 3; backend contract #374. Built in
`app/automations/` (list, `edit/`, `activity/`), `app/instagram-connected/`, Edit Profile's creator card
and `base/widgets/instagram/`.

### Tokens and measurements

All colours from the active palette: surfaces `background` / `surface` / `cardBackground`, `cardBorder`
hairlines, `border` dividers; `text` / `textSubtle` / `textMuted`; `primary` / `primaryText` (CTA, switch
on, selected ring, step dots, DM bubble); `chipBackground` / `chipText` (keywords, step numbers, selected
recipe row); status pills from the severity surfaces (success Sent, warning Older than 7 days / expired,
danger the other failures); `danger` for Disconnect / Delete / `{link}` missing. Measurements are
`AutomationMetrics` (`base/widgets/instagram/automation-metrics.ts`): Connect h48 pill with a 22 seal,
rule thumb 64 / 72 web, summary thumb 56, keyword chip 24 (removable 32 with a 28 ×), empty disc 64 and
step dots 28, CTA max 340, progress h4, stepper 190, recipe row 64 (thumb 48, radio 22), post ring 3 +
check 24 + Reel badge 20, activity row 64 (avatar 36), status pill 24, DM bubble 82% / radius 18 with a 4
tail, preview card 220 (image 2:1), page max 960, preview column 300.

### Screens

1. **Edit profile → Creator account (Instagram row):** not linked → the seal, "Instagram", Connect with
   Instagram (busy: spinner + "Waiting for Instagram…"), the why, and "Enter handle for manual review
   instead" (opens the existing form); cancelled → warning banner above the button. Linked → `@handle`,
   "Verified via Instagram" (shield), Approved pill, an Automations row (send icon, title, sub), Disconnect
   (ghost) → ConfirmSheet. Expired → warning banner with the date + Reconnect. TikTok unchanged.
2. **Automations** (`/automations`): bar (back, title, "+ New"); sub; account strip; rule cards (thumb,
   up to 3 keywords + "+n", recipe with utensils, "124 sent · Off/Paused", switch) paged on scroll; empty
   (disc, title, three numbered steps, CTA); paused (banner + Reconnect, switches and New disabled); not
   connected (title + Connect); rules note under the list. Profile shows an entry row while linked.
3. **Editor** (`/automations/edit?ruleId=`): bar (×, New/Edit automation, "Step n of 4 · name"); a phone
   shows 4 progress segments, an expanded viewport a 190 stepper (number → check, back freely, forward
   past valid steps); footer Back + Next/Save (disabled until the step is valid).
   Step 1 posts grid 3 / 4 columns, paged, selected ring + check, Reel badge, "Has rule". Step 2 keywords
   (Enter or comma adds; lower-cased, deduped, ≤10 × ≤40), suggestions (dashed), "Try a comment" →
   Matches · word / No match. Step 3 own recipes, server search, paged, radio rows. Step 4 DM (auto-grow,
   counter n/900, insert `{name}` `{link}`, `{link}` required with a danger border and alert), public reply
   switch + field (≤300), Delete (edit), preview (comment context, bubble with `{name}`→Zeynep and the link
   underlined, recipe card, public reply under a dashed rule) — beside the fields when expanded.
4. **Activity** (`/automations/activity?ruleId=`): bar (back, Activity, Edit); summary (thumb, every
   keyword, recipe, switch); Sent count; All / Sent / Failed; rows (initial, @handle, time ago, quoted
   comment, status pill with a label for every reason code, "Replied publicly"); paged; no-retry note;
   "No comments matched yet."

### Departures from the prototype

1. **No failed count.** `DmRule` carries `sentCount` only, so cards read "124 sent · Off" and Activity
   shows one stat (Sent), not Sent / Failed.
2. **The All / Sent / Failed segment filters the loaded rows**; the sends endpoint has no status filter, so
   paging continues across all kinds.
3. **Delete asks first** (ConfirmSheet) instead of a toast with Undo — a deleted rule cannot be restored
   through the API.
4. **Lists page on scroll** (`onEndReached`) everywhere — rules, posts, recipes, sends — instead of the
   prototype's "1–5 of 8" pager.
5. **The post of an existing rule is fixed** (the API does not change `mediaId`); editing opens on
   Keywords and the post step only shows it.
6. **Draft recipes are listed but not selectable** ("Not published — publish it to send"): the picker uses
   the food search's `group=mine`, which includes drafts.
7. **Web always returns to Edit Profile** after the login (same-tab redirect to `/instagram-connected`),
   wherever the user started it.
8. **Switch** is the platform `Switch` with the palette's track colours, not a custom 51×31 control; the
   Profile entry's sub line is the feature's purpose (no "n on · n DMs sent" — those totals are not on the
   wire).

## Creators (Sept 2026)

**Source of truth:** the Claude Design canvas **Recipely Creators**
(<https://claude.ai/artifact/K5HupwQzSYHUuzX9PNpnnq>), boards `Main` (Explore, phone, light),
`StripDark`, `WebExplore`, `CreatorsList` (/creators), `CreatorProfile` (/creators/[userId]) and
`CreatorAccount` (Edit Profile, four states). Contract: `docs/creator-tag-contract.md`.

### 1. Surfaces

| Surface | Where | Notes |
|---|---|---|
| Creators strip | phone feed list header, under the cuisine strip, right above the recipes | heading 18/700 + subtitle 12 `textSubtle`, "See all" 14/700 `primary`; row of 72-wide items, gap 12, padding 16 |
| Creators row | expanded feed, after the cuisine rail, above the recipe grid | heading 22/700, subtitle 13 + "See all" on the right; ONE row of up to six wide cards, gap 16 |
| /creators | phone and web | back 44 round + title 20/700; intro 13 `textSubtle`; card grid, 2 columns on a phone, up to 6 (`creatorGridColumns`, min card 150) |
| /creators/[userId] | phone and web (cap 980) | back + share; 112 ring avatar; name 24/800; verified chip; bio 14 `textSubtle` (max 320); stats card; Follow pill 48; "Recipes" 18/700 + count; recipe grid 2 (phone) / 3 (expanded) |
| Creator account | Edit Profile, under the name/bio card | surface card, radius 16, padding 16, gap 12 |
| Verified chip | creator page and the owner's own Profile | 32 min height, round, `surface` + 1px `border`, mark 24, `@handle` 13/600, check 14 `primary`; opens the account on its platform |

Strip and row are hidden before the first answer, on an empty list and on a failed first load.

### 2. Tokens

- **New colour `textSubtle`** (ThemeColors): handles, captions, counts, intro and bio. `textMuted` mixed
  towards `text` in 5% steps until it reaches 4.5:1 on BOTH `background` and `surface`
  (`readableMuted` in `themes.ts`). Used in the creators UI only.
- **New avatar sizes:** `avatarSizes.creatorStrip` 64, `avatarSizes.creatorCard` 72; the wide card uses
  `xl` 80, the profile `frame` 112 / `frameInner` 106 with a 3px page-coloured gap.
- Platform mark plates (`creatorMarkGeometry`): strip 22, card 24, wide card 26, chip 24, claim row 28,
  radio 20; glyph 55% of the plate; a 2px ring in the colour it is cut out of. The glyph is
  `ProvenanceGlyph`'s Instagram / TikTok outline painted white (`ink`), on `BrandColors.instagramGradient*`
  or `BrandColors.tiktokNote`. The profile ring: Instagram gradient, TikTok `tiktokCyan`→`tiktokRed`.
- Spacing / radii / type from the existing ladders: gaps 2/4/6/8/12/16, card radius `xl` 16, option
  radius `lg` 12, pills `round`; `PillButton` (new, `base/widgets/buttons`) 48 primary / 44 outline.
- Status pills: `useSeveritySurfaces()` warning / success / danger (`bg` + `text`), 28 min height, 12/700.
  Withdraw / Remove labels use the danger surface's `text`, not `colors.danger`.

### 3. Contrast (measured, `creator-contrast.test.ts`)

`textMuted` on Pearl White light `background` is **4.12:1** — why `textSubtle` exists.

| Palette | Variant | `textSubtle` | on `background` | on `surface` |
|---|---|---|---|---|
| Pearl White | light | `#5C6B81` | 4.69 | 5.09 |
| Pearl White | dark | `#95A1B2` | 6.64 | 4.57 |
| Crimson Ember | light | `#636A76` | 4.59 | 5.04 |
| Crimson Ember | dark | `#AB9090` | 6.71 | 4.60 |
| Emerald Garden | light | `#636B76` | 4.53 | 4.99 |
| Emerald Garden | dark | `#8FB7A9` | 5.93 | 4.62 |
| Royal Purple | light | `#64627C` | 4.56 | 5.26 |
| Royal Purple | dark | `#B197BE` | 6.21 | 4.63 |

Status pill label on its fill (severity surfaces are fixed per variant, so every palette measures the
same): light — in review 6.39, approved 4.76, not approved 5.72; dark — 11.88, 10.26, 9.08.

### 4. Where the build departs from the canvas

- `textSubtle` on Pearl White light is `#5C6B81` (4.69:1), a touch lighter than the canvas's `#55657D`:
  the token is the least change from `textMuted` that clears AA on both grounds in every palette.
- Avatars without a photo use the app's `AvatarImage` fallback (primary gradient, `primaryText`
  initials) rather than the canvas's `primaryLight` disc with `primary` initials, so a creator reads the
  same here as everywhere else in the app. The canvas's 2px surface ring round the strip avatar is not drawn.
- The claim form, when opened on an existing claim (Change, Edit and resend), adds a Cancel outline pill
  under Send for review — the canvas only draws the empty form, which has nothing to go back to.
- The follow button turns into an outline "Following" pill once followed; the canvas draws only "Follow".
- The Instagram plate is the three-stop gradient the canvas draws (`instagramGradientStart/Mid/End`).

## Creators + Recipely Kitchen (Oct 2026 — supersedes "Creators (Sept 2026)" where they differ)

**Source of truth:** the [Recipely Prototype](https://claude.ai/design/p/174d3c66-20f8-49e9-bffa-3bf97ef8aaf1?file=Recipely+Prototype.html)
(`src/social.jsx`, `src/widgets.jsx`, `src/photos.jsx`, `src/theme.js`); Tweaks → Starting screen *Detail · Kitchen,
Creators, Creator profile, Creator · form / in review / approved / rejected*. Spacing `xs 4 · sm 8 · md 12 · lg 16 ·
xl 24 · xxl 32`; radii `lg 12 · xl 16 · round`.

### 1. Tokens and contrast

- `textSubtle` (unchanged, `readableMuted`): `textMuted` mixed toward `text` in 5 % steps until ≥ 4.5:1 on both
  `background` and `surface`. Values and ratios as in the Sept table (Pearl light `#5C6B81` 4.69 / 5.09 … Purple dark
  `#B197BE` 6.21 / 4.63). Used for handles, captions, stat labels, the photo credit, the USDA note and the `@username`
  under the Profile name and in the recipe author card.
- `primaryText` on `primary` ≥ 5.68:1 and `chipText` on `chipBackground` ≥ 4.52:1 in every palette — the approved
  badge, Follow and the selected platform radio rely on them. `success` / `danger` are icon ink only.
- New type steps: `fontSizes.largeTitle` 30 (web creator name), `fontSizes.pageHeading` 36 (web /creators h1).
  Half-point sizes in the prototype (10.5, 11.5, 12.5, 13.5) round to the nearest step (11, 11, 12, 13).

### 2. Creators

| Piece | Measurements |
|---|---|
| Platform seal (`CreatorPlatformMark`) | the provenance seal on the page: white face, 1px `cardBorder`, brand-ink glyph 60 %; 22 on a 64 avatar (`max(20, round(avatar × 0.34))`), offset −2/−2, 2px `background` halo; 22 in chips, 24 in the claim radios |
| Platform badge (`CreatorTagChip`) | 32 high, round, `surface`, 1px `cardBorder`, padding 0 10 0 4, gap 6; seal 22 · `@handle` 13/600 `text` · `checkmark-circle` 14 `primary`; links to the account; a11y "Verified {platform} account: {handle}" |
| Approved badge (`CreatorBadge`) | `primary` disc, `primaryText` check at 62 %; 22 phone Profile, 20 web Profile, 18 in the Approved card; a11y "Approved creator" |
| Creator card | `cardBackground`, 1px `cardBorder`, radius 16, padding 20 12 16; avatar 64; name 15/700 mt 10; `@handle` 13 `textSubtle`; "N recipes · N followers" 12 `textSubtle` mt 6; shadow sm, web hover md + 2 up |
| Strip (phone) | heading 15/700; "See all ›" 13/700 `primary` + chevron 14, min 44; items 76 wide, gap 12, padding 2 16 8; name 12/700, handle 11 `textSubtle` |
| Row (web) | h2 22/800; "See all" 14/700, 36 high; six columns, three below an 860 viewport; gap 16 |
| /creators | phone: back 44 + title 24/700, subtitle 13 `textSubtle`, 2 columns gap 12; web: "Back to recipes" 14/600 `textMuted`, h1 36/800, subtitle 15, `auto-fill minmax(180)` gap 20 |
| Creator profile | ring avatar 104 / 128 (2px `primaryGradient` 135°, 2px `background` gap); name 24/800 / 30/800 mt 12; badge mt 8; bio 14/1.45 `text`, max 340, mt 8; stats card mt 16 (`surface`, `cardBorder`, radius 16, padding 12 0, value 18/800, label 11/600 upper-case +0.5 `textSubtle`, 1px `border` dividers); Follow mt 12, 48 high, round, 15/700 + icon 16, full width on a phone, stats + Follow capped at 460 expanded; heading 18/800 (22/800 web) + count 14 `textSubtle`; phone tiles 2 columns gap 16/12 (square photo radius 16, seal 24 at 8/8, name 13/700 two lines, "★ 4.7 · 25 min" 12 `textSubtle`), web `WebRecipeCard` `auto-fill minmax(270)` gap 24 with the save toggle |
| Edit profile → Creator account | `SectionHeader` + one card (`surface`, `cardBorder`, radius 16, padding 16, gap 12). Form: intro 13 `text`; PLATFORM radios 48, radius 12, gap 8 (selected `chipBackground` + 1.5 `primary` + `chipText`; unselected `background` + 1.5 `cardBorder`); HANDLE field 48, radius 12, `@` prefix `textSubtle`, a typed `@` and spaces dropped; Submit primary 48, disabled until the platform's minimum length. In review: 40 tile + `hourglass` `primary`, title 16/800, neutral handle chip, Withdraw (ghost 48). Approved: `checkmark-circle` `success`, title + badge 18, platform badge, Unlink account (ghost). Rejected: `alert-circle` `danger`, neutral chip, Try again (primary → form prefilled). Result states are `role="status"` |
| Profile tab | approved badge right of the name, gap 8; `@username` in `textSubtle` |

### 3. Recipely Kitchen

- `origin: CURATED` → the provenance mark `Curated`, alone: the full-colour Recipely logo in the white seal, label
  "Recipely Kitchen" / "Recipely Mutfağı". Same seal slot and sizes as AI/import (card 27, web card 28, creator tile 24).
- Detail: the AI-style chip (`chipBackground`, `chipText` 12/600, padding 2 12 2 2, seal 22); mobile under the author
  card (mt 10), web under the title meta row (12 gap + 2). Author card / web byline read "Recipely Kitchen" with the logo
  avatar and a `primary` `checkmark-circle`, no recipe count.
- Photo credit: "Photo: {author} · {license}", 12/1.3 `textSubtle`, author underlined, the whole line one link to the
  credit url (`accessibilityRole="link"`). Mobile directly under the cover, min-height 44, −12 below; web under the
  framed viewer, gap 8, min-height 28. Only `http(s)` links are accepted (`ImageCredit`).
- USDA: last row of the nutrition block when `nutritionSource === 'USDA_FDC'` — tag "USDA" 10/800 +0.5, padding 2 6,
  radius 4, 1px `border`, `textSubtle`; text 12 `textSubtle`; gap 8.

### 4. Where the build departs from the prototype

- The Explore strip and row keep their current place on the recipes page (that page is not a prototype target); only
  their own measurements follow the prototype.
- The claim hint and review bodies keep the admin-review wording: the prototype's "add recipely.app/@{username} to your
  bio" and "up to 2 days" describe a bio check and a turnaround the backend does not do.
- Submit enables at the platform's minimum handle length (`CreatorHandleRules`, Instagram 1, TikTok 2), not a fixed 2.
- The form opened from Try again keeps a Cancel outline pill, so a user can back out to the rejected card.
- The /creators subtitle carries no count: the list is paged and the total is not known up front.
- The 140 ms hover transition on creator cards is not animated; the lift is immediate.

### Rev 2 and rev 3 (Oct 2026) — Chefs tab and one claim per platform

Source: the Recipely Prototype spec rev 3 (sections marked rev 2 / rev 3).

- **Chefs tab (rev 3):** `/creators` is a root tab — fifth bottom tab (chef hat, between My Recipes and Diary;
  labels 10, one line), web header item lit on `/creators` and creator pages. No back button; 24/700 title
  (web h1 36/800, 40 under the header), subtitle 13 (web 15). Empty: 64 chef-hat disc + "No chefs yet." The
  Creators strip and web row are gone from the Recipes home. A creator page goes back to Chefs ("Back to chefs").
- **Per-platform accounts (rev 2):** avatar seals — one per verified account, the second shifted left by 60 % of
  a seal (13 at 22) behind the primary, one image "Verified on Instagram and TikTok"; creator card — one handle
  line per account (seal 18 + `@handle` 13 `textSubtle`), caption pinned to the bottom; creator profile — one
  linked platform badge per account, wrapping, centred, gap 8; Profile tab — one approved badge once any platform
  is approved.
- **Edit profile (rev 2):** one card, `overflow hidden`, hairline-separated: intro 13; a row per claimed platform
  (seal 36, platform 15/700 + `@handle` 13 — a link once approved, status pill 24 high: in review hourglass
  `primary`, approved on `primary`, rejected alert `danger`; body 13; one action 44 high, round, 14/700 —
  Withdraw / Unlink ghost, Try again primary); a "Link {Platform} account" row (min 60, seal 36, plus 18 `primary`)
  per unclaimed platform, which opens the form in its place (seal 28 title, HANDLE label 11/700 `textMuted`, 48
  field, hint 12, Cancel ghost + Submit primary flex 1). One form at a time; no platform picker.
- **Departures:** the review and rejection bodies keep the admin-review wording (no "add recipely.app/@username to
  your bio", no "up to 2 days"); Submit unlocks at each platform's minimum handle length; status-pill icons are
  14 (spec 13–14); half-point type sizes round to the ladder.

## Tab app bar and Chefs coming soon (Oct 2026)

Source: the Recipely Prototype, Tweaks → "Tab bars · compare" and "Chefs - coming soon". Phone frames only; the
web shell keeps its own headings.

- **Tab app bar (`base/widgets/navigation/tab-app-bar.tsx`):** one bar on all five bottom-tab roots, so the title
  never moves when switching tabs. 56 tall (8 top and bottom around a 40 row), 16 sides, `background`. Title
  24/700 (`title` variant), one line; 12 between the title area and the actions. Actions are
  `TabAppBarButton` only: 40 round, hairline `cardBorder`, `surface` fill, 20 glyph in `text`; the primary
  variant fills `primary` with a `primaryText` glyph. 8 between actions, at most three. The unread badge sits
  2 outside the bell's top-right corner.
- **Per tab:** Recipes — 28 logo inline (8 before the title), bell; the bar still slides away with the
  collapsing band. My Recipes — cart, primary add, bell. Chefs — bell; the subtitle moves under the bar (13,
  `textSubtle`, 12 below) and only shows once there are chefs. Diary — calendar, goals, bell. Profile — bell;
  the avatar block starts 16 below the bar (was 32). Owner decision: every tab has the bell, no settings gear
  on Profile.
- **Chefs coming soon (`app/creators/items/chefs-coming-soon.tsx`):** shown while the list is loaded and empty.
  Content 16 sides, 24 above the hero; capped at 480 and centred on a wide viewport. Hero 200×176: halos 176
  (`primaryHaloOuter`, primary 8 %) and 128 (`primaryHaloInner`, 16 %), an 88 gradient core
  (`primaryGradientStart` → `primaryGradientEnd`, `shadows.md`) with a 44 chef hat in `primaryText`; four 36
  chips (`cardBackground`, `cardBorder`, `shadows.sm`, 18 `primary` glyphs: restaurant, heart, star, flame)
  that bob 5 over 3.2 s, staggered, and stay still under reduce motion. Pill 16 below: 26 tall, 10 sides,
  round, `chipBackground` / `chipText`, 12/700 with a 12 sparkle. Title 12 below: 22/800, tight tracking.
  Body 8 below: 14, `textSubtle`, max 300. Ghost grid 24 below: 2×2, 12 gap, the real card's shape (radius 16,
  padding 20/12/16, 64 avatar, bars 12/10/8 tall at 62/46/54 % in `skeleton`), opacity 0.6, fading into
  `background` from 35 % of its height. CTA card overlaps the grid by 72: radius 16, padding 16, `shadows.md`,
  12 gap; heading 15/700; button 48 tall, radius 12, `primary`, 15/700 with an 18 chef hat — opens Edit
  profile at Creator account.
- **Copy:** `creators.comingSoon.{pill, title, body, creatorQuestion, apply}` in all 14 locales;
  `creators.empty` is gone.

## Cooking mode (Oct 2026 — interim, not from the prototype)

TODO(design): cooking mode to be redesigned in Claude Design

Claude Design was unavailable when cook mode shipped; the owner approved building it from existing base widgets
and theme tokens. Nothing here is a design decision to preserve — redraw it in the prototype (rule 28) and replace
this section with the spec that comes out of it.

- **Route:** `app/recipes/[recipeId]/cook/` (full screen, header hidden). Entry: a `restaurant-outline` circle in the
  mobile hero's floating cluster; a filled primary "Start cooking" pill first in the web header's action row.
- **Layout:** top bar (outlined close circle, recipe name, "Ingredients" pill) → progress bar
  (`controlSizes.progressBar`, primary fill) → step pane ("STEP 3 OF 8" in primary, a "Done" checkbox pill, the step
  at `fontSizes.title` with a relaxed line height, the step's timer when it names a duration) → Previous (outlined) / Next
  (primary; success-green "Finish" on the last step), split evenly (flex 1 / flex 1), `controlSizes.fab` min height,
  labels wrap to a second line rather than truncate in long locales. The "Ingredients" and "Done" pills use sentence-case
  `caption` semibold (like "Start cooking"), and "Done" is `controlSizes.touchTarget` tall.
- **Widths:** full width on a phone; a centred column capped at `layoutSizes.webModalMaxWidth` on tablet and desktop.
- **Ingredients:** `BottomSheet` (sheet on mobile, centred dialog on the web shell), one line per ingredient.

## Shopping list (Oct 2026 — interim, not from the prototype)

TODO(design): shopping list to be redesigned in Claude Design

Claude Design was unavailable when this shipped, so the screen is built from existing widgets and tokens only, with
no new measurement or colour:

- **Route:** `/shopping-list` (account page, `Disallow`ed in `robots.txt`). Entry points: Profile (a row under the
  profile actions, every platform), My Recipes (a cart `RoundIconButton` beside "Create new" in both headers), and
  the recipe page's "Add to shopping list" toast action.
- **Screen:** a top bar (back + title; no inset or hairline in the web shell) → content capped at
  `WEB_CONTENT_MAX_WIDTH.shoppingList` (720) on expanded viewports → the add field (`controlSizes.searchBar` min
  height, `inputBackground` / `inputBorder`, a primary round + button) → "Clear completed" / "Clear all" pills
  (each through `ConfirmSheet`) → "To buy (n)" then "Completed (n)" label headings → rows.
- **Row:** card surface, hairline border, `radii.lg`; a tick (`checkmark-circle` in primary / `ellipse-outline`),
  "amount · label" (line-through and muted when ticked), "From {recipe}" caption, edit and remove round buttons.
  The whole left part is the tick's target.
- **Edit:** `BottomSheet` (sheet on mobile, centred dialog on the web shell) with name, amount and unit fields and a
  primary Save; a refusal shows the error's body copy in `danger` under the fields.
- **Recipe page:** an outlined primary "Add to shopping list" button (`controlSizes.buttonSm`) under the
  ingredient list on mobile, inside the ingredients card on the web sidebar, and in cook mode's ingredients sheet
  footer. The toast counts added and merged lines and offers "View".

## Notifications: timer heads-ups and come-back reminders

TODO(design): the reminders opt-in sheet and the Settings "Notifications" section are to be redesigned in
Claude Design. Claude Design was unavailable when they were built, so both reuse existing widgets:

- **Opt-in:** the shared `ConfirmSheet` on the recipe feed, once, on a return visit a day after the first open.
  Title, a message saying what is sent, how often and where to stop it, "Yes, remind me" (primary) and
  "Not now" (the new `cancelLabel`).
- **Settings:** a "Notifications" section under Appearance with one `SettingsRow` ("Recipe reminders",
  `notifications-outline`) whose right element is the shared `SettingsSwitch` (primary track when on). Native only.
- **Timer heads-ups** have no in-app surface: a quiet notification at 5 and 1 minute left.

## Creator stats (Oct 2026 — from the prototype)

**Prototype:** Recipely Prototype → `src/creator-stats.jsx`; Tweaks → Starting screen *Creator stats* (+ `· loading`,
`· no automations`, `· no sends`, `· not connected`, `· error`). Spec file in the design project:
`specs/creator-stats-rn-spec.md`. Plan and data contract: [`docs/creator-stats-plan.md`](../../docs/creator-stats-plan.md).

**Route** `/automations/stats` (`CreatorStatsScreen`), reached from a stats button in the Automations bar (icon on a
narrow window, outlined "Stats" pill when `isExpanded`) and from a second row in the profile's automations card
("Last 30 days · {s} DMs · {p} opened"); both appear only once there is at least one automation. A post row opens that
automation's Activity.

**Layout**: content max 960, centred, padding 16. Range segment (7 / 30 / 90, `SegmentedTabs`) on top. Funnel strip —
`surface` card, hairline `border` dividers — a 2 × 2 grid, one row of four from 600 content width. Daily chart and
followers card stack; side by side `1.7 : 1` from 720. Posts: stacked rows, a table with a header row from 720.

**Measurements** live in `app/automations/stats/model/stats-metrics.ts`. Chart 160 / 200 tall, 30 px axis, gridlines
at 0, ½ and a 1 / 2 / 5 × 10ⁿ ceiling; Sent bars `textMuted` + `colorAlphas.medium` (the prototype's 35% has no token;
40% is the nearest), Opened line `primary` 2.25, Saved line `text` 1.75. Followers sparkline 96 / 150, area
`chipBackground`; when tracking began inside the range, a dashed `textMuted` run (3 4) leads to the first dot and a
"Tracking since …" note replaces "· last N days".

**Deliberate differences from the prototype**
- Table columns are 92 / 92 / 100 / 108 (prototype 76 / 76 / 84 / 92) so the Turkish headers fit on one line.
- Posts load five more per "Show more" instead of the prototype's pager.
- Chart scrub: press-and-drag (touch) and hover (pointer); arrow-key scrubbing is not in yet.
- Mobile row meta wraps to a second line instead of truncating (Turkish is long).
- The header is the shared `AutomationsBar` on every width, as on Automations and Activity.

**Delta chip**: `sevSurfaces.success` up, `.danger` down, neutral 0%, hidden when the previous period was 0.
**States**: skeleton; no automations (disc + CTA → editor); no sends in range (longer-range + "View automations",
followers card under it); not connected (`InstagramConnectBlock`); error (Try again).

## Meal planner (Oct 2026 — from the prototype)

**Source:** the Claude Design prototype (`src/meal-planner.jsx`, `src/meal-planner-sheets.jsx`; Tweaks →
Starting screen *Plan · …*), written up there as `meal-planner-rn-spec.md`. Backend: recipely-backend #392
(`/me/meal-plan`). Behind the `mealPlanner` flag (DevOnly until #392 reaches production).

**Where it lives:** the Diary tab gets a **Plan | Log** `SegmentedTabs` switch (route `/diary?mode=plan`; Log is
the default and unchanged). Plan owns its own `ScrollView` so the phone's "Add week to shopping list" bar can sit
fixed under it. Recipe detail gets **Add to plan** (mobile under *Add to diary*, web in the sidebar under it).

**Tokens:** every measurement is in `mealPlanSizes` (`theme/tokens/sizing/meal-plan-sizes.ts`), copied from the
prototype: strip day h66, slot card header 16/700, planned row thumb 56 / title 14.5, stepper h32 (web h26, 44 pt via
`hitSlop`), eaten badge 22, web grid `84 + 7 × min 128`, min width 1036 (scrolls sideways below), cell min-h112,
add dialog max 520, shopping dialog max 560. Colours are theme tokens only; the over-goal tone is
`DIARY_TONES.over.solid`, "Eaten" is `DIARY_TONES.on`. New shared token: `opacities.done` (0.7) for an eaten meal's
photo.

**States:** signed out (lock disc, Sign in / Create account, both returning to the plan), loading (skeleton: strip +
3 slot cards / 4 grid rows, announced busy), error (`FormBanner` + Try again), empty week (seven tiles, "Plan your
week", Add a recipe / Copy last week; no shopping bar), week.

**Deliberate differences from the prototype:**
- *Add to plan* sits under *Add to diary*, not beside Save under the title — this app's Save is a floating action.
- No ±40 px swipe between weeks on the strip: it would fight the tab's vertical scroll; ‹ › page instead.
- The selected strip day's bar track is `gradientBorder` (white 28%) rather than 35% — the closest existing token.
- Today's web cells are not tinted `primary` 6% (no token); today's column head is outlined and pilled instead.
- Week and meal menus are the shared `BottomSheet` everywhere (a centred dialog on the web) — the codebase has no
  popover widget and rule 23 keeps menus in sheets.
- Servings follow the backend/diary scale (0.5 steps, 0.5–20) instead of the prototype's whole 1–12.
- The shopping list is the existing `/shopping-list` screen ("View list"), not a second list sheet.
- On a phone the sticky "Add week to shopping list" button stops a touch target short of the right edge, where
  the voice assistant's orb floats (the prototype has no orb).

## Cook from my fridge (Oct 2026 — from the prototype)

**Source:** the Claude Design prototype (`src/fridge.jsx`; Tweaks → Starting screen *Fridge · …*), written up there
as `fridge-to-recipe-rn-spec.md`. Backend: recipely-backend #393 (`/fridge/scan`, `/fridge/ideas`, 20 AI calls a day
shared). Behind the `fridgeToRecipe` flag (DevOnly until #393 reaches production).

**Route:** `/fridge` (`FridgeScreen`, robots `Disallow`, analytics `FridgeScreen`). Entry points: two mode cards on the AI
create screen (*Describe it* selected / *From my fridge*), and a 50-wide gradient camera button beside the phone's
Recipes AI banner. Both render nothing while the flag is off.

**Flow:** Capture (up to 3 photos, camera or library; web is the file picker) → Analysing (photo sweep, Cancel keeps
the photos) → Ingredients (chips, faded = not sure, tap removes with Undo, *+ Add*; filters max time / diet /
servings) → Ideas (cards with uses meter and missing chips, *Add missing to shopping list*, *Show 3 more*). An idea
becomes a prompt and opens the ordinary AI create flow (`/create-recipe?prompt=…`): same generating animation, same
draft editor. Full-screen states: nothing recognised (Retake / Type them instead), daily limit (Browse recipes /
Back); offline and other failures return to the step with a banner.

**Layout & tokens:** header back/close + centred title + "n/3" + three 4 pt progress segments; body max 560
(`WEB_CONTENT_MAX_WIDTH.fridge`), the ideas grid 920 (`fridgeIdeas`, cards min 260); footer CTA under a `cardBorder`
rule. Measurements in `fridgeSizes`.

**Deliberate differences from the prototype:**
- The *From my fridge* card sits under the import cards, above the prompt box, rather than at the very top — the
  prompt screen already leads with its hero and import entries.
- The web Recipes banner's outline "From my fridge" button is not added yet; the web reaches the flow through the AI
  create screen's mode card.
- On a phone the footer button stops short of the right edge, where the voice assistant's orb floats.
- The prototype's "Close → from" route param is not used: close goes back, or to the AI create screen when there is
  nothing to go back to (`useGoBackOrHome`).

## Navigation entry points — the shopping cart (Oct 2026 — from the prototype)

**Source:** Claude Design discoverability pass (`navigation-entry-points-rn-spec.md` in the prototype root).
The shopping list was reachable only from a Profile row, a My Recipes button and success toasts.

**Cart button:** `ShoppingCartButton` (base/widgets/navigation) — the tab app bar's round button with a
`cart-outline` glyph, immediately left of the bell on all five tab roots (Recipes, My Recipes, Chefs, Diary,
Profile); on the web, a 38-wide header button left of the bell, outlined `primary` while on `/shopping-list`.
Opens `/shopping-list`; a guest gets the sign-in sheet with a reason. The tab app bar now holds up to four actions
(Diary: calendar, goals, cart, bell).

**Badge:** `CountBadgeTone.ToDo` — `primary` fill, `primaryText` label, 2 px `background` ring, hidden at 0,
`99+` past 99. Red stays the bell's (an alert); the cart's number is a to-do count. The number is the server's
(`GET /me/shopping-list/summary`, backend #394) — the list is paged — re-read after every accepted change.
Label: "Shopping list, {n} to buy".

**Profile:** the shopping-list row's second line is the same count in words ("7 to buy" / "Empty").

**Deliberate differences from the prototype:**
- The prototype's Reminders screen (per-meal reminder times) is not built: the app's reminders are the
  come-back and timer reminders in Profile → settings; per-meal reminders need backend support first.
- The "Kitchen" group heading in Profile is not added; the shopping-list row keeps its place above the creator rows.
- The active-timers bar already shows on every screen in the app (mounted at the root), which the prototype lacked.
- The shopping-list screen keeps its existing layout (#537); aisle grouping on that screen is a follow-up.
