import { ValueConstants } from '@core/constants';

/**
 * The page a horizontal swipe of `dx` points asks for: +1 forward, -1 back.
 * Forward is the reading direction — a left swipe in a left-to-right layout,
 * a right swipe in a right-to-left one (Arabic), as the rest of the UI mirrors.
 */
export const swipePageDirection = (dx: number, isRTL: boolean): number => {
  const isForward = isRTL ? dx > ValueConstants.zero : dx < ValueConstants.zero;
  return isForward ? ValueConstants.one : ValueConstants.minusOne;
};
