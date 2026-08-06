/**
 * The theme, in three folders — read this before adding a file here.
 *
 * - `tokens/`  — design MEASUREMENTS: how big, how far apart, how opaque, how
 *   deep. One module per purpose, plus `scale.ts`, which adapts them to the
 *   device. Naming and ordering rules: `architecture.md` §5a.
 * - `colors/`  — the palettes and the semantic surfaces built on top of them.
 * - `context/` — which theme is active at runtime, and how a component reads it.
 *
 * A hook lives beside the thing it serves (`use-theme` in `context/`,
 * `use-text-line-height` in `tokens/`) rather than in a hooks/ dump, so the
 * folder a file sits in still answers "what is this for?".
 *
 * This barrel re-exports the VALUES a component consumes. Hooks, contexts and
 * the theme definitions keep their own import paths — they are wiring, not
 * vocabulary, and leaving them out stops the barrel from dragging a React
 * context into every module that only wanted a spacing number.
 */

// ── tokens/ — measurements ────────────────────────────────────────────────
export { spacing } from '@presentation/base/theme/tokens/sizing/spacing';
export { radii } from '@presentation/base/theme/tokens/sizing/radii';
export { fontSizes } from '@presentation/base/theme/tokens/typography/font-sizes';
export { lineHeights } from '@presentation/base/theme/tokens/typography/line-heights';
export { lineHeightFor } from '@presentation/base/theme/tokens/typography/line-height-for';
export { fontWeights } from '@presentation/base/theme/tokens/typography/font-weights';
export { letterSpacings } from '@presentation/base/theme/tokens/typography/letter-spacings';
export { iconSizes } from '@presentation/base/theme/tokens/sizing/icon-sizes';
export { controlSizes } from '@presentation/base/theme/tokens/sizing/control-sizes';
export { avatarSizes } from '@presentation/base/theme/tokens/sizing/avatar-sizes';
export { mediaSizes } from '@presentation/base/theme/tokens/sizing/media-sizes';
export { aspectRatios } from '@presentation/base/theme/tokens/sizing/aspect-ratios';
export { decorSizes } from '@presentation/base/theme/tokens/sizing/decor-sizes';
export { layoutSizes } from '@presentation/base/theme/tokens/sizing/layout-sizes';
export { borderWidths } from '@presentation/base/theme/tokens/sizing/border-widths';
export { opacities } from '@presentation/base/theme/tokens/effects/opacities';
export { durations } from '@presentation/base/theme/tokens/effects/durations';
export { colorAlphas } from '@presentation/base/theme/tokens/effects/color-alphas';
export { zIndices } from '@presentation/base/theme/tokens/effects/z-indices';
export { maxFontScales } from '@presentation/base/theme/tokens/typography/max-font-scales';
export { shadows } from '@presentation/base/theme/tokens/effects/shadows';
export { SCALE_FACTOR, scale, scaleFont } from '@presentation/base/theme/tokens/scale';

// ── colors/ — palette vocabulary ──────────────────────────────────────────
export { type ThemeColors } from '@presentation/base/theme/colors/palette/theme-colors';
export { BrandColors } from '@presentation/base/theme/colors/palette/brand-colors';
export { relativeLuminance, contrastRatio } from '@presentation/base/theme/colors/contrast/contrast';
