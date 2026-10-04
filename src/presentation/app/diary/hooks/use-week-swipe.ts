import { useMemo } from 'react';
import { PanResponder, type GestureResponderHandlers } from 'react-native';
import { diarySizes } from '@presentation/base/theme';
import { ValueConstants } from '@core/constants';

/**
 * Horizontal swipe on the week strip: past 40pt, left is the next week and
 * right the previous one (design spec → Food Diary §4). Claims the gesture
 * only once it is clearly horizontal, so the page still scrolls vertically.
 */
export const useWeekSwipe = (onPage: (direction: number) => void): GestureResponderHandlers =>
  useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > Math.abs(g.dy) && Math.abs(g.dx) > diarySizes.swipeThreshold / ValueConstants.two,
        onPanResponderRelease: (_, g) => {
          if (Math.abs(g.dx) <= diarySizes.swipeThreshold) return;
          onPage(g.dx < ValueConstants.zero ? ValueConstants.one : ValueConstants.minusOne);
        },
      }).panHandlers,
    [onPage],
  );
