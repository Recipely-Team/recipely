import { PixelRatio, useWindowDimensions } from 'react-native';
import { lineHeights } from '@presentation/base/theme/tokens/typography/line-heights';

/**
 * Line box for `fontSize` that follows the OS accessibility font scale.
 *
 * React Native multiplies `fontSize` by the system font scale when it renders
 * text, but leaves `lineHeight` exactly as written — so a hard-coded
 * `lineHeight: 22` stops containing its own glyphs the moment the user turns
 * text size up, and the paragraph clips or overlaps. Re-deriving the box from
 * the live `fontScale` (which `useWindowDimensions` re-publishes when the
 * setting changes) keeps the ratio intact at every size.
 *
 * Use this for rendered text. `lineHeightFor` is the static equivalent for a
 * `StyleSheet.create()` entry, where no hook can run.
 */
export const useTextLineHeight = (
  fontSize: number,
  ratio: number = lineHeights.normal,
): number => {
  const { fontScale } = useWindowDimensions();
  return PixelRatio.roundToNearestPixel(fontSize * ratio * fontScale);
};
