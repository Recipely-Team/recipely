import { layoutSizes, fontSizes, controlSizes } from '@presentation/base/theme';

/**
 * Cook mode's own measurements.
 *
 * @remarks
 * - **`columnMaxWidth`** keeps the step a readable column on a tablet or a
 *   desktop instead of a line the eye has to cross the room for.
 * - **`stepFontSize`** is read from arm's length, over a pan; a wider screen
 *   (`stepFontSizeExpanded`) usually stands further off, on a counter.
 * - **`swipeThreshold`** is how far a finger travels before it pages; below
 *   it the gesture is a wobble, not a swipe.
 */
export const cookModeSizes = {
  columnMaxWidth: layoutSizes.webModalMaxWidth,
  stepFontSize: fontSizes.title,
  /** The step on a tablet or a desktop, read from further away. */
  stepFontSizeExpanded: fontSizes.headline,
  swipeThreshold: controlSizes.touchTarget,
} as const;
