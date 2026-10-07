import { useMemo } from 'react';
import { I18nManager, PanResponder, type GestureResponderHandlers } from 'react-native';
import { ValueConstants } from '@core/constants';
import { swipePageDirection } from '@presentation/base/hooks/interaction/swipe-page-direction';

/**
 * Horizontal swipe paging: past `threshold` points, a swipe in the reading
 * direction pages forward (+1) and the other way back (-1) — left forward in
 * a left-to-right layout, mirrored in a right-to-left one (`swipePageDirection`).
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
          onPage(swipePageDirection(g.dx, I18nManager.isRTL));
        },
      }).panHandlers,
    [onPage, threshold],
  );
