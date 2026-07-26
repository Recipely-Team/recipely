import { useEffect, useMemo, useRef } from 'react';
import { Animated, PanResponder } from 'react-native';
import { shouldDismissDrag } from '@presentation/base/utils/should-dismiss-drag';
import type { UseDragToDismissResult } from '@presentation/base/hooks/interaction/use-drag-to-dismiss-result';
import { ValueConstants } from '@core/constants';

const SNAP_BACK_DURATION_MS = 200;

/**
 * Drag-to-dismiss gesture for a bottom sheet, built on React Native's core
 * `PanResponder`/`Animated` (no gesture-handler root-view wiring required,
 * since nothing else in this app currently relies on
 * `react-native-gesture-handler`'s `GestureDetector`).
 *
 * The release decision (tap vs. cleared-threshold drag vs. snap-back) lives
 * in the pure, independently-tested `shouldDismissDrag` — this hook is just
 * the `PanResponder`/`Animated` plumbing around it. Dragging upward is
 * clamped to 0 (can't pull the sheet past its resting position).
 * `translateY` resets to 0 whenever `visible` becomes true, so a sheet
 * dismissed mid-drag re-opens from a clean position.
 */
export const useDragToDismiss = (onClose: () => void, visible: boolean): UseDragToDismissResult => {
  const translateY = useRef(new Animated.Value(ValueConstants.zero)).current;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (visible) translateY.setValue(ValueConstants.zero);
  }, [visible, translateY]);

  const snapBack = (): void => {
    Animated.timing(translateY, {
      toValue: ValueConstants.zero,
      duration: SNAP_BACK_DURATION_MS,
      useNativeDriver: false,
    }).start();
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          translateY.stopAnimation();
        },
        onPanResponderMove: (_event, gestureState) => {
          translateY.setValue(Math.max(ValueConstants.zero, gestureState.dy));
        },
        onPanResponderRelease: (_event, gestureState) => {
          if (shouldDismissDrag(gestureState)) {
            onCloseRef.current();
            return;
          }
          snapBack();
        },
        onPanResponderTerminate: snapBack,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- snapBack/translateY are stable refs; onClose is read via onCloseRef.
    [translateY],
  );

  return { translateY, panHandlers: panResponder.panHandlers };
};
