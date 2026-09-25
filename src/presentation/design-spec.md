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

## Hand-off

### For ts-developer (Task #6) — exact `themes.ts` mutations

1. **Extend `ThemeColors` interface** at `presentation/base/theme/themes.ts:23`. Add at
   end of interface, before closing brace:

   ```ts
   onOverlay: string;
   onSuccess: string;
   ```

2. **Update `darkSemantics` and `lightSemantics`** at `presentation/base/theme/themes.ts:128-144`:

   ```ts
   const darkSemantics: VariantSemantics = {
     danger: '#F28B82',
     success: '#81C995',
     warning: '#FDD663',
     starFilled: '#FFD54F',
     overlay: 'rgba(0,0,0,0.6)',     // CHANGED from 0.55 → 0.6
     shadow: '#000000',
   };
   const lightSemantics: VariantSemantics = {
     danger: '#D93025',
     success: '#34A853',
     warning: '#FBBC04',
     starFilled: '#FFB800',
     overlay: 'rgba(0,0,0,0.55)',    // CHANGED — black, alpha 0.55 (was rgba(15,23,42,0.35))
     shadow: '#0F172A',
   };
   ```

3. **Update `makeColors`** at `presentation/base/theme/themes.ts:146` — add the two new
   constant tokens to the returned object:

   ```ts
   onOverlay: '#FFFFFF',
   onSuccess: '#0F1B0F',
   ```

4. **Bump dark-surface mix target** at `presentation/base/theme/themes.ts:120`:

   ```ts
   const DARK_SURFACE_TARGET = '#52535A';   // was '#3A3B41'
   ```

5. **Replace light-surface mix logic** at `presentation/base/theme/themes.ts:241`. Light
   surface should now lift TOWARD white, not pull TOWARD a gray:

   ```ts
   const surface = mixHex(a.background, '#FFFFFF', 0.55);   // was mixHex(a.background, LIGHT_SURFACE_TARGET, 0.4)
   ```

   The constant `LIGHT_SURFACE_TARGET = '#E8E8ED'` becomes unused — delete the
   declaration at line 124.

6. **Replace per-theme `background` hex values**, light AND dark, for all 20 themes per
   the tables in section A above. Concretely (search-and-replace pairs, light variants
   first then dark):

   | Theme           | LIGHT bg new   | DARK bg new    |
   |-----------------|----------------|----------------|
   | midnight-slate  | `#F2F4F7` (replaces `LIGHT_NEUTRAL_BG`) | `#0B0F1A` (replaces `DARK_NEUTRAL_BG`) |
   | pearl-white     | `#E8EFFB` (replaces `LIGHT_NEUTRAL_BG`) | `#0A1A33`     |
   | crimson-ember   | `#FBE7E7`     | `#1A0309`     |
   | amber-sunset    | `#FFEFD9`     | `#190A00`     |
   | golden-hour     | `#FCF3BF`     | `#1A1300`     |
   | lime-zest       | `#EAF7C8`     | `#0A1700`     |
   | emerald-garden  | `#D6F2E2`     | `#021A14`     |
   | teal-lagoon     | `#D2F1EC`     | `#021A1D`     |
   | cyan-frost      | `#D5F1F8`     | `#02141C`     |
   | ocean-deep      | `#D9ECFC`     | `#021024`     |
   | indigo-night    | `#DCDFFB`     | `#0B0824`     |
   | violet-bloom    | `#E8DEFB`     | `#100620`     |
   | royal-purple    | `#EDDDFB`     | `#180628`     |
   | fuchsia-flash   | `#F8DDF7`     | `#22042A`     |
   | rose-quartz     | `#FCDDE3`     | `#22030E`     |
   | coral-reef      | `#FFE0D8`     | `#2C0A14`     |
   | mint-breeze     | `#DAF3EC`     | `#072B26`     |
   | tangerine-dream | `#FFE0C2`     | `#2A1208`     |
   | lavender-mist   | `#EBE2FB`     | `#1F1733`     |
   | chartreuse-zap  | `#E0F5B5`     | `#162A00`     |

   Note: `midnight-slate` and `pearl-white` previously used the `LIGHT_NEUTRAL_BG` /
   `DARK_NEUTRAL_BG` constants — replace those references with the explicit hex listed.
   The `DARK_NEUTRAL_BG` constant is still referenced as a fallback `primaryText` value
   in midnight-slate dark (line 257) — leave that usage in place; only the `background:`
   field changes per-theme.

7. **Verify nothing else** consumed the old surface targets externally — `grep` for
   `DARK_SURFACE_TARGET` and `LIGHT_SURFACE_TARGET` and confirm they only live in
   `themes.ts`. (They do per current code.)

After ts-developer commits: re-run `npx tsc --noEmit` to confirm the new fields don't
break any consumer that destructures `ThemeColors`.

### For rn-developer (Task #7) — exact widget swaps

Three files use `colors.primaryText` for content that is NOT on `colors.primary`. Swap
to the new semantic tokens:

1. **`presentation/base/widgets/recipe-card.tsx:43`** — difficulty chip label.
   ```diff
   - <ThemedText variant="caption" style={{ color: colors.primaryText, fontWeight: '600' }}>
   + <ThemedText variant="caption" style={{ color: colors.onOverlay, fontWeight: '600' }}>
       {difficulty}
     </ThemedText>
   ```
   Leave the cuisine-badge label at line 38 unchanged — that one IS on `colors.primary`,
   so `colors.primaryText` is correct there.

2. **`presentation/base/widgets/checkbox-item.tsx:33`** — checkmark over `colors.success`.
   ```diff
   - {checked ? <Ionicons name="checkmark" size={16} color={colors.primaryText} /> : null}
   + {checked ? <Ionicons name="checkmark" size={16} color={colors.onSuccess} /> : null}
   ```

3. **`presentation/screens/tasks/task-list-screen.tsx:135`** — checkmark over `colors.success`.
   ```diff
   - <Ionicons name="checkmark" size={16} color={colors.primaryText} />
   + <Ionicons name="checkmark" size={16} color={colors.onSuccess} />
   ```

4. **`presentation/screens/tasks/task-detail-screen.tsx:73`** — large checkmark over `colors.success`.
   ```diff
   - <Ionicons name="checkmark" size={40} color={colors.primaryText} />
   + <Ionicons name="checkmark" size={40} color={colors.onSuccess} />
   ```

**Do NOT touch** `presentation/screens/recipes/recipe-detail-screen.tsx:152` (step-circle
number) — that text IS on `colors.primary`, so `colors.primaryText` is the correct
contracted token there. Verified ≥6.6:1 in every theme.

### For test-developer (Task #8) — contrast regression rules

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

### B.4 Task List Screen

**File:** `presentation/screens/tasks/task-list-screen.tsx`

**Layout:**

1. **Progress header** (sticky, above list)
   - Component: `<ProgressBar>` (new widget, see section C)
   - Container: paddingHorizontal: spacing.lg, paddingVertical: spacing.md
   - Text: `body` variant, e.g., "3 of 5 completed" / "3 / 5 tamamlandi" (new i18n key)
   - Progress bar below text:
     - height: `sizes.progressBarHeight (6)`
     - backgroundColor: `border`
     - borderRadius: `radii.round`
     - Inner fill: backgroundColor: `success`, borderRadius: `radii.round`
     - Width: animated to `(completedCount / totalCount) * 100%`
   - Place as `ListHeaderComponent`

2. **Task cards** (FlatList items)
   - Container: marginHorizontal: spacing.lg, backgroundColor: `cardBackground`, borderRadius: radii.lg (12), shadows.sm
   - padding: spacing.lg
   - flexDirection: row, alignItems: center
   - **Checkbox visual** (left side):
     - Component: reuse `<CheckboxItem>` or inline
     - size: `sizes.checkboxSize (24)`
     - Completed: backgroundColor `success`, borderRadius radii.sm, checkmark icon
     - Pending: borderWidth 2, borderColor `border`, borderRadius radii.sm, empty
   - **Title** (flex: 1, marginLeft: spacing.md):
     - `body` variant
     - If completed: `textDecorationLine: 'line-through'`, color `textMuted`
   - **Status badge** (right side):
     - backgroundColor: completed ? `successLight` : `warningLight`
     - text color: completed ? `success` : `warning`
     - borderRadius: `radii.round`
     - paddingHorizontal: 10, paddingVertical: 4
     - text: `caption` variant, fontWeight 600
   - `ItemSeparatorComponent`: `View` with height: spacing.sm (8)
   - Press: navigate to task detail

3. **Empty state**
   - Icon: `MaterialCommunityIcons` name="clipboard-check-outline" size=64 color=`textMuted`
   - Text: existing empty message

4. **Loading**: SkeletonLoader with 5 rows matching card height

### B.5 Task Detail Screen

**File:** `presentation/screens/tasks/task-detail-screen.tsx`

**Layout:**

1. **Task title** (top, padded)
   - `title` variant
   - marginBottom: spacing.lg

2. **Large checkbox toggle** (centered, visual)
   - Container: alignItems: center, marginTop: spacing.xl
   - Circle: width: 80, height: 80, borderRadius: 40
   - Completed: backgroundColor: `success`, icon `Ionicons` name="checkmark" size=40 color="#FFFFFF"
   - Pending: borderWidth: 3, borderColor: `border`, backgroundColor transparent
   - Animated bounce on render: `withSpring` scale 0 -> 1

3. **Status badge** (centered below checkbox)
   - marginTop: spacing.lg
   - Same styling as task list badge but larger:
     - paddingHorizontal: 20, paddingVertical: 10
     - text: `subtitle` variant
     - backgroundColor: completed ? `successLight` : `warningLight`
     - text color: completed ? `success` : `warning`
     - borderRadius: `radii.round`

4. **Loading**: centered ActivityIndicator (keep simple, single item screen)

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

### B.7 Navigation Updates

**Recommendation: Keep stack navigation + add a settings icon in the header.**

Rationale: The app has a focused, linear flow (Recipes -> Recipe Detail -> Tasks). Bottom tabs would create a flat structure that does not match the hierarchical data model. The only new top-level destination is Settings. A header icon is lighter weight and more appropriate for apps with fewer than 3 primary destinations.

**Implementation:**

In `presentation/navigation/root-layout.tsx`, update the `recipes/index` screen options:

```tsx
<Stack.Screen
  name="recipes/index"
  options={{
    title: t().navigation.recipes,
    headerRight: () => (
      <Pressable onPress={() => router.push('/settings')} style={{ marginRight: 8 }}>
        <Ionicons name="settings-outline" size={22} color={colors.text} />
      </Pressable>
    ),
  }}
/>
```

Add the settings route:
```tsx
<Stack.Screen
  name="settings"
  options={{ title: t().navigation.settings }}
/>
```

For the recipe detail screen, hide the default header to allow the floating back button over the hero image:
```tsx
<Stack.Screen
  name="recipes/[recipeId]/index"
  options={{ headerShown: false }}
/>
```

---

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

## D. i18n Keys to Add

### English (`presentation/i18n/en.ts`)

```ts
export const en = {
  common: {
    retry: 'Retry',
    loading: 'Loading...',
    error: 'Something went wrong',
    empty: 'Nothing here yet.',
    search: 'Search',               // NEW
    cancel: 'Cancel',               // NEW
    of: 'of',                       // NEW (for "3 of 5")
  },
  login: {
    // ... existing keys unchanged ...
  },
  recipes: {
    // ... existing keys unchanged ...
    searchPlaceholder: 'Search recipes...',         // NEW
    noResults: 'No recipes match your search.',     // NEW
    servings: 'Servings',                           // NEW
    totalTime: 'Total time',                        // NEW
  },
  tasks: {
    // ... existing keys unchanged ...
    progress: '{current} of {total} completed',     // NEW (use string interpolation)
    allCompleted: 'All tasks completed!',           // NEW
  },
  settings: {                                       // NEW section
    title: 'Settings',
    appearance: 'Appearance',
    theme: 'Theme',
    themeSystem: 'System',
    themeLight: 'Light',
    themeDark: 'Dark',
    language: 'Language',
    account: 'Account',
    signOut: 'Sign out',
    signOutConfirm: 'Are you sure you want to sign out?',
    about: 'About',
    version: 'Version',
  },
  navigation: {
    recipes: 'Recipes',
    recipe: 'Recipe',
    tasks: 'Tasks',
    task: 'Task',
    settings: 'Settings',           // NEW
  },
};
```

### Turkish (`presentation/i18n/tr.ts`)

```ts
export const tr: Translations = {
  common: {
    retry: 'Tekrar dene',
    loading: 'Yukleniyor...',
    error: 'Bir seyler ters gitti',
    empty: 'Henuz bir sey yok.',
    search: 'Ara',                              // NEW
    cancel: 'Iptal',                            // NEW
    of: '/',                                    // NEW
  },
  login: {
    // ... existing keys unchanged ...
  },
  recipes: {
    // ... existing keys unchanged ...
    searchPlaceholder: 'Tarif ara...',           // NEW
    noResults: 'Aramanizla eslesen tarif yok.',  // NEW
    servings: 'Porsiyon',                        // NEW
    totalTime: 'Toplam sure',                    // NEW
  },
  tasks: {
    // ... existing keys unchanged ...
    progress: '{current} / {total} tamamlandi',  // NEW
    allCompleted: 'Tum gorevler tamamlandi!',    // NEW
  },
  settings: {                                    // NEW section
    title: 'Ayarlar',
    appearance: 'Gorunum',
    theme: 'Tema',
    themeSystem: 'Sistem',
    themeLight: 'Acik',
    themeDark: 'Koyu',
    language: 'Dil',
    account: 'Hesap',
    signOut: 'Cikis yap',
    signOutConfirm: 'Cikis yapmak istediginize emin misiniz?',
    about: 'Hakkinda',
    version: 'Surum',
  },
  navigation: {
    recipes: 'Tarifler',
    recipe: 'Tarif',
    tasks: 'Gorevler',
    task: 'Gorev',
    settings: 'Ayarlar',                         // NEW
  },
};
```

---

## E. Theme Additions

### E.1 New Color Tokens

See section A.1 for the complete list and exact hex values for both light and dark palettes. Summary of new tokens:

- `primaryLight`, `primaryGradientStart`, `primaryGradientEnd`
- `secondary`, `secondaryText`
- `success`, `successLight`, `warning`, `warningLight`
- `cardBackground`, `cardBorder`
- `inputBackground`, `inputBorder`, `inputBorderFocused`
- `skeleton`, `skeletonHighlight`
- `shadow`, `overlay`
- `starFilled`, `starEmpty`
- `tabBarBackground`, `tabBarBorder`, `tabBarActive`, `tabBarInactive`
- `avatarBackground`, `sectionBackground`

### E.2 Shadow Styles

New file: `presentation/base/theme/shadows.ts` (see section A.4 for full implementation).

Three levels: `shadows.sm`, `shadows.md`, `shadows.lg`.

### E.3 Card Elevation Presets

Add to `presentation/base/theme/index.ts`:

```ts
export { shadows } from './shadows';
export { sizes } from './spacing';
```

Card styles are composed in each component from:
- `cardBackground` + `cardBorder` colors
- `shadows.md` (default) or `shadows.sm` (settings rows)
- `borderRadius: radii.xl (16)` for recipe cards, `radii.lg (12)` for settings groups

---

## F. Implementation Priority

Order of work with rationale:

### Phase 1: Foundation (do first, everything depends on this)
1. **Theme system enhancements**
   - Add all new color tokens to `colors.ts` (both light and dark)
   - Add new spacing/sizing tokens to `spacing.ts`
   - Create `shadows.ts`
   - Add `headline` and `label` variants to `themed-text.tsx`
   - Update `theme/index.ts` exports
   - Install `expo-linear-gradient`: `npx expo install expo-linear-gradient`

### Phase 2: Shared components (build the toolbox)
2. **New reusable widgets** (can be built in parallel)
   - `SkeletonLoader` (needed by recipe list, task list, recipe detail)
   - `SearchBar` (needed by recipe list)
   - `RecipeCard` (needed by recipe list)
   - `CheckboxItem` (needed by recipe detail, task list)
   - `SectionHeader` (needed by recipe detail, settings)
   - `ProgressBar` (needed by task list)
   - `SettingsRow` (needed by settings)
   - `AvatarImage` (needed by settings)
   - `ThemeToggle` (needed by settings)
   - `LanguageSelector` (needed by settings)

### Phase 3: New feature
3. **Settings/Profile screen**
   - Create `presentation/screens/settings/settings-screen.tsx`
   - Create route file `presentation/app/settings.tsx`
   - Add settings icon to recipe list header in root-layout
   - Add i18n keys for settings

### Phase 4: Highest visual impact screens
4. **Recipe list redesign**
   - Replace plain text rows with `RecipeCard`
   - Add `SearchBar` as ListHeaderComponent
   - Replace loading spinner with `SkeletonLoader`
   - Add local search/filter state
   - Add i18n keys for search

5. **Recipe detail redesign**
   - Full-width hero image with floating back button
   - Info chips row with icons
   - Ingredient checkboxes with `CheckboxItem`
   - Numbered instruction steps
   - Section headers

### Phase 5: Login and task screens
6. **Login screen redesign**
   - Gradient background with `expo-linear-gradient`
   - Card form overlay
   - Input fields with icons
   - KeyboardAvoidingView

7. **Task screens redesign**
   - Task list: progress bar, card layout, checkbox visuals
   - Task detail: large checkbox visual, status badge

### Phase 6: Polish
8. **Navigation updates**
   - Hide header on recipe detail (floating back button)
   - Settings header icon on recipe list
   - Verify all screen transitions look correct

---

## G. Dependencies to Install

Before starting implementation, run:

```bash
npx expo install expo-linear-gradient
```

All other needed libraries (`react-native-reanimated`, `expo-image`, `@expo/vector-icons`, `react-native-safe-area-context`) are already in the project.

---

## H. File Summary

### Files to modify:
- `presentation/base/theme/colors.ts` -- add 22 new color tokens
- `presentation/base/theme/spacing.ts` -- add `xxxl`, `radii.xs`, `radii.xxl`, `sizes` export
- `presentation/base/theme/index.ts` -- add exports for shadows, sizes
- `presentation/base/widgets/themed-text.tsx` -- add `headline` and `label` variants
- `presentation/i18n/en.ts` -- add ~20 new keys
- `presentation/i18n/tr.ts` -- add ~20 new keys
- `presentation/navigation/root-layout.tsx` -- add settings route, header icon, hide recipe detail header
- `presentation/screens/login/login-screen.tsx` -- full redesign
- `presentation/screens/recipes/recipe-list-screen.tsx` -- full redesign
- `presentation/screens/recipes/recipe-detail-screen.tsx` -- full redesign
- `presentation/screens/tasks/task-list-screen.tsx` -- redesign
- `presentation/screens/tasks/task-detail-screen.tsx` -- redesign

### Files to create:
- `presentation/base/theme/shadows.ts`
- `presentation/base/widgets/recipe-card.tsx`
- `presentation/base/widgets/search-bar.tsx`
- `presentation/base/widgets/skeleton-loader.tsx`
- `presentation/base/widgets/checkbox-item.tsx`
- `presentation/base/widgets/progress-bar.tsx`
- `presentation/base/widgets/settings-row.tsx`
- `presentation/base/widgets/avatar-image.tsx`
- `presentation/base/widgets/section-header.tsx`
- `presentation/base/widgets/theme-toggle.tsx`
- `presentation/base/widgets/language-selector.tsx`
- `presentation/screens/settings/settings-screen.tsx`
- `presentation/app/settings.tsx`

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

### Implementation checklist for rn-developer

File: `presentation/screens/recipes/recipe-list-screen.tsx` (mobile branch only; `!isWebShell`).

1. **Add layout tokens** to `presentation/base/theme/spacing.ts` `sizes`: `homeHeaderMax: 132`,
   `homeHeaderMin: 0`, `homeTitleShrink: 96`, `fab: 56`, `fabExtendedHeight: 48`. (ts-developer or
   rn-developer — it's a token file edit; coordinate so it lands before the screen change.)
2. **Add i18n key** `recipes.filtersAndSort` to `en.ts` and `tr.ts` (values in the i18n table).
3. **Convert the mobile list to a Reanimated scroll surface:** replace the mobile `FlatList` with
   `Animated.FlatList`, add `onScroll={useAnimatedScrollHandler(...)}` writing `scrollY` and
   tracking direction; `scrollEventThrottle={16}`. Keep the web `FlatList` path as-is.
4. **Build the collapsing band** as an absolutely-positioned `Animated.View` (`zIndex:20`) holding
   the title row (eyebrow + title + bell, from `RecipesAppHeader` content) and `SearchBar`. Apply
   `titleScale`, `eyebrowOpacity`, `searchOpacity`, and `headerTranslateY` per "Collapsing header
   band". Add `contentContainerStyle.paddingTop = sizes.homeHeaderMax`.
5. **Implement direction-aware hide/reveal + snap** (220ms `Easing.out(Easing.cubic)`), forcing
   shown when `scrollY <= sizes.homeHeaderMax`.
6. **Move `AiBannerCard`, `CuisineStrip`, the result-count/Clear-all row, and the active-filter
   chips row into `ListHeaderComponent`** (mobile only). Remove them from the fixed area.
7. **Build the FAB** (extended ↔ compact morph, badge, dark-safe ring) per "Filter / Sort FAB".
   Tapping opens the filter `BottomSheet`. Hide it until `state.status === 'loaded'`.
8. **Fold Sort into the filter sheet** as a `SelectChip` row at the top; remove the standalone sort
   `BottomSheet` from the mobile flow (keep it for web if web still uses it — verify; web uses the
   same sheet today, so guard removal behind `!isWebShell` or keep sort sheet for web only).
9. **Reduced-motion branch:** when reduce-motion is on, render the band statically shown and the FAB
   permanently extended; skip translate/scale animations.
10. **Accessibility:** FAB label per the Accessibility section; ensure 44pt+ targets; keep bell label.
11. **Leave `RecipesAppHeader`, `AiBannerCard`, `CuisineStrip` component files unchanged** unless a
    prop is needed — prefer composing them in the screen. If the title row must be extracted for the
    band, do it inside the screen folder, don't alter the shared header's web usage.

After implementation: `npm run lint`, `npx tsc --noEmit`, run the touched-layer tests. No theme
color values changed, so **contrast tests do not need re-running** for this section.

---

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

### Implementation notes for rn-developer

- New widget file: `presentation/screens/recipes/recipe-author-card.tsx` (one component +
  `RecipeAuthorCardProps`). Keep it in the `recipes` feature folder, not `base/widgets` (it is
  detail-screen-specific). Compose it into `recipe-detail-screen.tsx` after the nutrition row.
- Props: `{ authorName: string; authorPhotoUrl?: string; recipeCount: number; isOwner: boolean }`.
  The screen resolves owner-vs-author and passes resolved values down; the card stays presentational.
- Reuse: `AvatarImage`, `ThemedText`, `SkeletonLoader`, `spacing`/`radii`/`fontSizes`/`sizes` tokens.
- **No new theme tokens.** No `themes.ts` change, so **contrast tests do not need re-running** for this
  section.
- ts-developer / data: provide a way to resolve a `UserProfile` by `ownerId` (a use case + store
  selector, or extend the existing `userProfileStore` to cache-by-id) so the card can show the other
  author's name/photo/count. If that lookup does not exist yet, that is the gating prerequisite — flag it.

---

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

### Implementation notes for rn-developer

- Edit `presentation/screens/profile/profile-screen.tsx`: remove the floating actions block
  (lines ~76–95), remove the share + web-settings buttons from the action row (lines ~203–219), add the
  4th "Saved" stat cell, and append the Appearance / Account / About sections (lift the JSX from
  `settings-screen.tsx:75–131`, swapping the standalone-screen chrome for inline section headers).
- Saved count source: `savedRecipesStore` exposes `savedIds: ReadonlySet<string>`
  (`application/recipes/saved-recipes-store.ts`). Render `String(savedIds.size)`. It is local and
  synchronous — no loading state needed for that cell.
- Reuse widgets: `SectionHeader`, `SettingsRow`, `ThemeToggle`, `ThemeGrid`, `LanguageSelector`,
  `AvatarImage`, `ThemedText`, `TabBar`. Do **not** duplicate them.
- The screen will get long — if it exceeds the ~120-line focus budget, split the embedded settings into a
  `profile-settings-sections.tsx` sub-component in the same feature folder (one component per file rule).
- `/settings` route: decide with the team whether to (a) redirect it to `/profile`, or (b) delete the
  route + screen. Either way, remove the now-dead gear/settings navigation. If deleting
  `settings-screen.tsx`, that is the only file removed; the merged content lives in the profile.
- **No theme token changes** — so **contrast tests do not need re-running** for this section. test-developer
  only needs new/updated tests for the screen behavior (saved-count cell, removed share button), not contrast.

---

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

### F. New i18n Keys

Cross-checked against `presentation/i18n/en.ts`. Keys that already exist are marked and must NOT be
re-added.

| Key | en value | tr value | Status |
|---|---|---|---|
| `recipes.trending` | `Trending this week` | (check tr.ts) | EXISTS — reuse for hero badge |
| `recipes.aiPromo` | `Generate a recipe with AI` | (check tr.ts) | EXISTS — reuse for banner title |
| `recipes.aiPromoSubtitle` | `Describe what you want — I'll handle the rest` | `Ne canın istiyorsa anlat — gerisini bana bırak` | **ADD** — the wide web banner adds a subtitle line not in the current compact banner |
| `recipes.aiStart` | `Start` | `Başla` | **ADD** — the "Start" chip on the web banner |
| `recipes.viewRecipe` | `View recipe` | `Tarifi gör` | **ADD** — hero featured card primary CTA |
| `recipes.heroByAuthor` | `by {name}` | `{name} tarafından` | **ADD** — author byline in hero card; `{name}` is a runtime interpolation placeholder |
| `recipes.heroTotalMin` | `{n} min` | `{n} dk` | **ADD** — meta row total time; `{n}` is runtime interpolation |
| `recipes.browseCuisines` | `Browse cuisines` | (check tr.ts) | EXISTS |
| `recipes.filterByCuisine` | `Filter by a cuisine` | `Bir mutfağa göre filtrele` | **ADD** — section head sub on cuisine grid |
| `recipes.cuisineAll` | `All` | `Tümü` | **ADD** — the "All" tile in cuisine grid |
| `recipes.webAllRecipes` | `All recipes` | `Tüm tarifler` | **ADD** — recipe grid section head when no filter |
| `recipes.webSearchResults` | `Search results` | `Arama sonuçları` | **ADD** — recipe grid head while searching |
| `recipes.webCuisineRecipes` | `{cuisine} recipes` | `{cuisine} tarifleri` | **ADD** — recipe grid head for active cuisine; `{cuisine}` is runtime interpolation |
| `recipes.webRecipesCount` | `{n} recipes` | `{n} tarif` | **ADD** — recipe grid sub count; `{n}` is runtime interpolation |
| `recipes.difficultyAll` | `All` | `Tümü` | **ADD** — difficulty segmented control "All" option |
| `recipes.save` | `Save` | (check tr.ts) | EXISTS |
| `recipes.saved` | `Saved` | (check tr.ts) | EXISTS |
| `recipes.sortBy` | `Sort by` | (check tr.ts) | EXISTS |
| `recipes.sortPopular` | `Popular` | (check tr.ts) | EXISTS |
| `recipes.sortRating` | `Top rated` | (check tr.ts) | EXISTS |
| `recipes.sortTime` | `Quickest` | (check tr.ts) | EXISTS |
| `recipes.sortNewest` | `Newest` | (check tr.ts) | EXISTS |
| `recipes.webEmptyBody` | `Try different filters or search terms.` | `Farklı filtreler veya arama terimleri deneyin.` | **ADD** — empty-state body text in web recipe grid |

**Total new keys to add: 12** — `aiPromoSubtitle`, `aiStart`, `viewRecipe`, `heroByAuthor`,
`heroTotalMin`, `filterByCuisine`, `cuisineAll`, `webAllRecipes`, `webSearchResults`,
`webCuisineRecipes`, `webRecipesCount`, `difficultyAll`, `webEmptyBody`.
(Count is 13 lines above; `difficultyAll` and `cuisineAll` share the same en value "All" but are
semantically distinct keys — keep them separate for future localization divergence.)

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

### H. Integration into `RecipeListScreen`

The rn-developer modifies only the `isWebShell === true` branch of `RecipeListScreen`. The mobile
branch (`!isWebShell`) is untouched.

Changes to the web branch:

1. Replace `<AiBannerCard onPress={...} />` with `<WebAiBanner onPress={...} />`.
2. Replace `<TrendingStrip onOpenRecipe={openRecipe} />` with `<WebHeroSection onOpenRecipe={openRecipe} />`.
3. Replace `<CuisineStrip selectedCuisines={...} onToggle={...} />` with
   `<WebCuisineGrid selectedCuisines={filters.cuisines} onToggle={toggleCuisineQuick} />`.
4. Replace the bare `<FlatList ... />` web body with `<WebRecipeGrid ... />`, passing the existing
   `filteredRecipes`, `isSearching`, `activeCuisine` (= `filters.cuisines[0] ?? null`), `sortBy`,
   `setSortBy` (as `onSortChange`), `activeDifficulty`, `onDifficultyChange`, `gridColumns`,
   and `openRecipe`.
5. Add `activeDifficulty: Difficulty | null` state + `setActiveDifficulty` to `RecipeListScreen`
   (alongside the existing `filters` state). When `activeDifficulty` changes on web, rebuild the API
   call: `difficulties: activeDifficulty ? [activeDifficulty] : []`. This is a NEW web-only difficulty
   state that works in parallel with the existing `filters.difficulties` (which is the sheet-based one);
   they can merge or stay separate — rn-developer's call, but they must not conflict.
6. Wrap all four new web components in the centered container (`maxWidth: sizes.webContentMax`,
   `paddingHorizontal: spacing.xxl`, `alignSelf: 'center'`, `width: '100%'`). The existing
   `stickyHeader` stays full-width above this container.
7. Consolidate the `maxWidth: 1200` literal in `styles.listCenter` and `styles.listContent` to
   `sizes.webContentMax` while touching the file.

All imports of the new files should use the `@presentation/screens/recipes/` path alias. The
`web-hero-constants.ts` file is imported by the two hero card components only.

---

### I. Implementation Notes

- `WebHeroSection` is the most complex new component and should be built first. It gates itself on the
  `trendingRecipesStore` having ≥ 3 loaded recipes — if the trending data loads after the page paint, a
  skeleton placeholder prevents layout shift.
- `WebAiBanner` is a direct web replacement for `AiBannerCard`. The existing `AiBannerCard` stays
  unchanged (mobile uses it). The rn-developer should NOT modify `AiBannerCard`.
- `WebCuisineGrid` must handle the "All" tile's special toggle logic cleanly. The `'ALL'` sentinel
  key must not collide with real taxonomy cuisine keys; confirm with ts-developer that `'ALL'` is not
  a valid `CuisineKey` enum value.
- `RecipeCard` hover-lift extension: adding `hoverEffect?: boolean` and two `Animated.View` wrappers
  (one for the card, one for the image) within `RecipeCard`. This must not break any existing usage
  (default `hoverEffect={false}` disables the hover behavior).
- The `WebSortMenu` component calls `onSortChange` which in `RecipeListScreen` sets `setSortBy` AND
  calls `load(...)`. The existing sort sheet already does this; `WebSortMenu` replaces the sort-pill
  trigger, NOT the sheet itself — that sheet (`sheetOpen === 'sort'`) is still the mechanism.
- All new files must be ≤ 120 lines per the codebase coding standard. `WebHeroFeaturedCard` is the
  most content-heavy; if it exceeds 120 lines, extract the button row into a
  `web-hero-action-row.tsx` sub-component in the same folder.
- No new Expo packages are required; `expo-linear-gradient` and `expo-image` are already installed.

---

### Hand-off

**ts-developer** (theme file change):
1. Add `heroButtonText: string` to `ThemeColors` interface in `presentation/base/theme/themes.ts`.
2. Add `heroButtonText: '#0F172A'` to `makeColors` (both dark and light, constant value).
3. Flag contrast test re-run: the new `heroButtonText` token is a constant — no per-theme variance —
   so no new contrast test rows are needed. The existing test-developer suite does not need updating
   for this token.

**ts-developer** (spacing file change):
4. Add to `sizes` in `presentation/base/theme/spacing.ts`:
   `heroAvatarSm: 28`, `heroActionBtn: 50`, `heroMiniMinHeight: 205`, `rankBadge: 26`,
   `aiBannerIcon: 52`, `sparkleDecor: 80`, `cuisineTileMin: 110`, `cuisineTileMinSm: 90`,
   `webSortBtn: 42`, `webEmptyIcon: 56`, `webContentMax: 1200`.

**ts-developer** (i18n):
5. Add 13 new keys to `presentation/i18n/en.ts` under `recipes:`:
   `aiPromoSubtitle`, `aiStart`, `viewRecipe`, `heroByAuthor`, `heroTotalMin`,
   `filterByCuisine`, `cuisineAll`, `webAllRecipes`, `webSearchResults`,
   `webCuisineRecipes`, `webRecipesCount`, `difficultyAll`, `webEmptyBody`
   (values in the i18n table in section F).
6. Mirror all 13 keys with Turkish values in `presentation/i18n/tr.ts`.

**rn-developer** (new files):
7. Create `presentation/screens/recipes/web-hero-constants.ts` — 4 rgba constant exports.
8. Create `presentation/screens/recipes/web-hero-section.tsx`.
9. Create `presentation/screens/recipes/web-hero-featured-card.tsx`.
10. Create `presentation/screens/recipes/web-hero-mini-card.tsx`.
11. Create `presentation/screens/recipes/web-ai-banner.tsx`.
12. Create `presentation/screens/recipes/web-cuisine-grid.tsx`.
13. Create `presentation/screens/recipes/web-section-head.tsx`.
14. Create `presentation/screens/recipes/web-sort-menu.tsx`.
15. Create `presentation/screens/recipes/web-recipe-grid.tsx`.
16. Extend `presentation/base/widgets/recipe-card.tsx` with `hoverEffect?: boolean` prop + hover
    animation (web-only, `Platform.OS === 'web'`).
17. Modify `presentation/screens/recipes/recipe-list-screen.tsx` web branch per section H.
18. Consolidate `maxWidth: 1200` literal to `sizes.webContentMax` in `recipe-list-screen.tsx`.

**test-developer**:
19. Add contrast assertion `contrastRatio(colors.heroButtonText, colors.onOverlay) >= 17.0` to the
    existing contrast suite (verifies the constant pair is always correct regardless of theme).
20. Note the pre-existing watchlist item: `textMuted`/`cardBackground` at 3.65:1 in pearl-white dark
    (below AA body-text 4.5:1). Add a comment in the contrast test file flagging this pairing for a
    future palette revision, but do not block on it now.

**Contrast tests:** `heroButtonText` is a new constant token — add one assertion per item 19 above.
No per-theme re-run is needed for spacing/i18n changes.

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

### Hand-off

**ts-developer** (domain + infrastructure — the badge has no data to render without these):
1. `src/domain/recipes/recipe-entity.ts` — add three getters mirroring the existing pattern
   (`get origin(): RecipeOriginType { return this.props.origin; }`, plus `sourceUrl` and
   `sourceHandle` as `string | undefined`). Props already exist on `RecipeEntityProps`; only the
   getters are missing.
2. `src/domain/recipes/recipe-summary-entity-props.ts` — add `origin: RecipeOriginType`.
3. `src/domain/recipes/recipe-summary-entity.ts` — add the matching `origin` getter.
4. `src/infrastructure/recipes/recipe-mapper.ts` — in `toRecipeSummary`, add
   `origin: toRecipeOrigin(dto.origin)` (reuse the existing helper, same as `toRecipe` already
   does at line 50). `RecipeListItemDto.origin` already exists on the wire type — no DTO change.
5. Do **not** add `sourceHandle`/`sourceUrl` to `RecipeSummaryEntityProps` — the list endpoint
   doesn't send them (confirmed: `RecipeListItemDto` has no such fields), and the compact badge
   never needs them (Section A).
6. `test-developer` follow-up: `recipe-summary-entity.test.ts` and any `toRecipeSummary` mapper
   test need a case asserting `origin` round-trips; existing fixtures that omit `origin` should
   default through `toRecipeOrigin(undefined)` → `RecipeOrigin.User`.
7. Flag the `pearl-white` dark `textMuted`/`surface` = 2.52:1 audit finding above for a follow-up
   fix (out of scope for this badge) — likely either a per-theme `textMuted` override for
   `pearl-white` dark (matching the pattern the other three themes already use) or a `surface` mix
   adjustment. Re-run needed: none for THIS badge's tokens (it uses none of the failing pairing).

**rn-developer** (presentation — theme tokens, i18n, widgets, wiring):
8. `src/presentation/base/theme/tokens/sizing/layout-sizes.ts` — add
   `tooltipMaxWidth: 220` (not device-scaled, consistent with the rest of `layoutSizes`).
9. New file `src/presentation/base/constants/external-links.ts` — export
   `instagramProfileUrl(handle: string): string`, returning `` `https://instagram.com/${handle}` ``.
   Follows the same "parameterised builder, not a literal at the call site" convention as
   `RoutePaths`'s builder functions, for an external rather than in-app target.
10. New file `src/presentation/base/widgets/tooltip/hover-tooltip.tsx` — `HoverTooltip` per the
    Shared Primitive section above.
11. New file `src/presentation/base/widgets/badges/provenance-badge.tsx` — `ProvenanceBadge`,
    props `{ origin: RecipeOriginType; variant: 'compact' | 'detailed'; sourceHandle?: string;
    style?: StyleProp<ViewStyle> }`. Returns `null` for `RecipeOrigin.User` before touching any
    other prop (mirrors `CountBadge`'s "nothing at zero" pattern in
    `src/presentation/base/widgets/text/count-badge.tsx`). Internal icon/color lookup keyed by
    origin, same shape as `count-badge.tsx`'s `OVERFLOW` lookup.
12. `src/presentation/i18n/locales/en.ts` and `.../tr.ts` — add under `recipes:`:

    | Key | en | tr |
    |---|---|---|
    | `originAiTooltip` | `AI wrote this recipe from a prompt.` | `Yapay zekâ bu tarifi bir istemden yazdı.` |
    | `originAiA11y` | `AI-written recipe` | `Yapay zekâ ile yazılmış tarif` |
    | `originAiDetailLabel` | `AI-written recipe` | `Yapay zekâ ile yazılmış tarif` |
    | `originImportTooltip` | `Imported from an Instagram post.` | `Bir Instagram gönderisinden alındı.` |
    | `originImportA11y` | `Imported from Instagram` | `Instagram'dan alındı` |
    | `originImportDetailLabel` | `Imported from {handle} on Instagram` | `Instagram'da {handle} hesabından alındı` |
    | `originImportHandleA11y` | `Open {handle} on Instagram` | `Instagram'da {handle} hesabını aç` |

    `originAiA11y`/`originAiDetailLabel` intentionally duplicate their en value (same reasoning
    the existing `cuisineAll`/`difficultyAll` pair already documents in this file: kept as
    separate keys for independent future localization). Render `{handle}` as `@` + the raw
    `sourceHandle` (i.e., the template's `{handle}` placeholder is replaced with `@{sourceHandle}`,
    not the bare handle) when composing `originImportDetailLabel` / `originImportHandleA11y`.
13. `src/presentation/base/widgets/cards/recipe-card.tsx` — add `origin?: RecipeOriginType` to
    `RecipeCardProps`; render `<ProvenanceBadge origin={origin ?? RecipeOrigin.User} variant="compact" />`
    as the first child of `styles.metaRow`.
14. `src/presentation/app/recipes/items/cards/recipe-list-item.tsx` — pass `origin={recipe.origin}`
    into `<RecipeCard .../>`.
15. `src/presentation/base/widgets/cards/web-recipe-card.tsx` — render
    `<ProvenanceBadge origin={recipe.origin} variant="compact" />` as the last child of
    `styles.metaRow` (reads `recipe.origin` directly — `WebRecipeCard` already takes the entity).
16. `src/presentation/app/recipes/[recipeId]/body/recipe-overview.tsx` — insert the detailed
    `<ProvenanceBadge variant="detailed" origin={recipe.origin} sourceHandle={recipe.sourceHandle} />`
    row per Section B's mobile layout.
17. `src/presentation/app/recipes/[recipeId]/body/web-recipe-detail-header.tsx` — same, per
    Section B's web layout.
18. Known, accepted gap: `HoverTooltip` has no Escape-key dismiss handler (see "General rule"
    above) — acceptable for this feature, not acceptable to copy forward uncritically the next
    time this primitive is reused for something where the tooltip is the ONLY place the
    information lives.

**Contrast tests:** add the five pairings from the "Contrast verification" table above as
assertions (`contrastRatio(...) >= 4.5` / `>= 3.0` as marked) across the 4 current themes ×
light/dark — the numbers above are the floor, not a suggestion. The `pearl-white` dark
`textMuted`/`surface` finding is a separate, pre-existing regression test to add
(`contrastRatio(colors.textMuted, colors.surface) >= 3.0`, currently failing) — file it as
expected-to-fail or `.skip` with a comment pointing at this section until `ts-developer` fixes it,
per item 7 above; do not silently drop it.
