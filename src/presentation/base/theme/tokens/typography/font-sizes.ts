import { scaleFont } from '@presentation/base/theme/tokens/scale';

/**
 * The type scale, ascending. Steps are ROLE-named rather than t-shirt-named
 * because a font size is chosen by what the text *is* (a caption, a title),
 * not by how big it should be — that is the whole point of a type scale.
 *
 * Device-scaled at half strength (see `scale.ts`); the OS accessibility font
 * setting multiplies on top of these at render time, so never pair one with a
 * hard-coded `lineHeight` — derive the line box from `lineHeights` instead.
 */
export const fontSizes = {
  nano: scaleFont(9),
  tiny: scaleFont(10),
  micro: scaleFont(11),
  small: scaleFont(12),
  caption: scaleFont(13),
  medium: scaleFont(14),
  body: scaleFont(15),
  heading: scaleFont(16),
  subtitle: scaleFont(18),
  subheading: scaleFont(20),
  display: scaleFont(22),
  title: scaleFont(24),
  headline: scaleFont(32),
  jumbo: scaleFont(40),
  hero: scaleFont(44),
} as const;
