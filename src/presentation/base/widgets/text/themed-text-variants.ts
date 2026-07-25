import { fontSizes, lineHeights } from '@presentation/base/theme';
import type { ThemedTextVariant } from '@presentation/base/widgets/text/themed-text-variant';

/**
 * Size and line-box ratio behind each {@link ThemedTextVariant}.
 *
 * Kept out of the component's `StyleSheet` because the line box cannot be a
 * static style: it has to be re-derived from the OS font scale at render time
 * (see `useTextLineHeight`). Weight, tracking and casing stay in the
 * stylesheet — those do not move with the font scale.
 */
export const themedTextVariants: Record<
  ThemedTextVariant,
  { fontSize: number; ratio: number }
> = {
  headline: { fontSize: fontSizes.headline, ratio: lineHeights.snug },
  title: { fontSize: fontSizes.title, ratio: lineHeights.snug },
  subtitle: { fontSize: fontSizes.subtitle, ratio: lineHeights.normal },
  body: { fontSize: fontSizes.body, ratio: lineHeights.normal },
  caption: { fontSize: fontSizes.caption, ratio: lineHeights.normal },
  label: { fontSize: fontSizes.caption, ratio: lineHeights.normal },
};
