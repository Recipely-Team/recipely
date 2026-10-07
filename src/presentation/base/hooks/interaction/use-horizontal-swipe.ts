import { useMemo } from 'react';
import { PanResponder, type GestureResponderHandlers } from 'react-native';
import { ValueConstants } from '@core/constants';

/**
 * Horizontal swipe paging: past `threshold` points, left pages forward (+1) and
 * right pages back (-1).
 *
 * @remarks
 * - **Claims the gesture only once it is clearly horizontal**, so a vertical
 *   scroll under the same finger still scrolls.
 * - **Shared by the diary week strip and cook mode's steps.**
 */
export const useHorizontalSwipe = (
  onPage: (direction: number) => void,
  threshold: number,
): GestureResponderHandlers =>
  useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > Math.abs(g.dy) && Math.abs(g.dx) > threshold / ValueConstants.two,
        onPanResponderRelease: (_, g) => {
          if (Math.abs(g.dx) <= threshold) return;
          onPage(g.dx < ValueConstants.zero ? ValueConstants.one : ValueConstants.minusOne);
        },
      }).panHandlers,
    [onPage, threshold],
  );
