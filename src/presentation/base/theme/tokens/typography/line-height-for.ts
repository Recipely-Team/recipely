import { PixelRatio } from 'react-native';
import { lineHeights } from '@presentation/base/theme/tokens/typography/line-heights';

/**
 * Derives a static line box from a font size and a {@link lineHeights} ratio.
 *
 * For `StyleSheet.create()` entries, where a hook cannot run. Text that must
 * stay legible at large accessibility font sizes should use
 * `useTextLineHeight` instead — it re-derives the box when the OS font scale
 * changes, which a module-load computation cannot do.
 */
export const lineHeightFor = (
  fontSize: number,
  ratio: number = lineHeights.normal,
): number => PixelRatio.roundToNearestPixel(fontSize * ratio);
