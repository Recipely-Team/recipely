import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, useWindowDimensions, type LayoutChangeEvent, type ViewStyle } from 'react-native';
import { ValueConstants } from '@core/constants';

/** How long the panel takes to travel in, and back out. */
const PANEL_ENTER_MS = 260;
const PANEL_EXIT_MS = 220;
/** How long the dimming takes to arrive. Leaving is not a duration — see below. */
const SCRIM_ENTER_MS = 160;

/** What the sheet needs to draw itself: whether to mount, and how to move. */
interface SheetPresentation {
  /** True while the panel is on screen OR still travelling off it. */
  isMounted: boolean;
  /** The dimming layer's opacity. */
  scrim: Animated.Value;
  /** The panel's own motion — a slide on a phone, a fade once expanded. */
  panelMotion: Animated.WithAnimatedObject<ViewStyle>;
  /** Hand the panel's measured height back, so it travels its own height. */
  measure: (event: LayoutChangeEvent) => void;
}

/**
 * Opens and closes a modal panel, and keeps the dimming out of its motion.
 *
 * @remarks
 * - **The dimming is not part of the panel, so it does not travel with it.**
 *   `Modal`'s own `animationType="slide"` moves the whole window, backdrop
 *   included: closing a sheet slid the dark layer down the screen with it, and
 *   for the length of that slide the app was visible with a receding shadow
 *   over it. A scrim answers one question — is there something in front of this
 *   screen — and the moment the answer is no it should stop being drawn. So the
 *   panel travels, the scrim only fades IN, and on the way out it is cleared in
 *   the same frame the sheet is dismissed.
 * - **It stays mounted for the length of its exit.** `visible` going false
 *   starts the panel leaving; the caller tears the `Modal` down when it has
 *   left. Without that the sheet vanished rather than closing, which is the
 *   same lack of animation the native window was hiding.
 * - **The panel is parked off-screen until it has been measured**, because how
 *   far it travels is its own height, and opening against a guess and
 *   correcting it a frame later is a visible jump. That makes `onLayout` a
 *   precondition for the sheet appearing at all — deliberate, but worth
 *   knowing: a panel that never lays out never arrives.
 * - **JS-driven throughout**, because the drag gesture that shares this
 *   transform is: mixing a native-driven value into an `Animated.add` with a
 *   JS-driven one is an error at runtime, not a type error.
 */
export const useSheetPresentation = (
  visible: boolean,
  isExpanded: boolean,
  dragOffset: Animated.Value,
): SheetPresentation => {
  const { height: windowHeight } = useWindowDimensions();
  const [isMounted, setIsMounted] = useState(visible);
  const [panelHeight, setPanelHeight] = useState<number | null>(null);
  const scrim = useRef(new Animated.Value(ValueConstants.zero)).current;
  /** 0 while resting, 1 while off-screen. */
  const away = useRef(new Animated.Value(ValueConstants.one)).current;

  useEffect(() => {
    if (visible) {
      setIsMounted(true);
      Animated.timing(scrim, {
        toValue: ValueConstants.one,
        duration: SCRIM_ENTER_MS,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }).start();
      // One layout pass behind on the first open, and never again: the panel
      // is parked off-screen until it knows how tall it is.
      if (panelHeight === null) return;
      Animated.timing(away, {
        toValue: ValueConstants.zero,
        duration: PANEL_ENTER_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
      return;
    }

    // The one line this hook exists for: the dimming goes in the frame the
    // sheet is dismissed, rather than riding the panel off the bottom.
    scrim.setValue(ValueConstants.zero);
    const exit = Animated.timing(away, {
      toValue: ValueConstants.one,
      duration: PANEL_EXIT_MS,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: false,
    });
    exit.start(({ finished }) => {
      if (finished) setIsMounted(false);
    });
    return () => exit.stop();
  }, [visible, scrim, away, panelHeight]);

  // The dialog has nowhere to slide to, so it arrives and leaves by fading;
  // the sheet travels its own height. The drag offset is ADDED rather than
  // replaced, so a sheet released mid-drag continues from where the finger
  // left it instead of snapping back to open and then closing.
  const panelMotion = isExpanded
    ? {
        opacity: away.interpolate({
          inputRange: [ValueConstants.zero, ValueConstants.one],
          outputRange: [ValueConstants.one, ValueConstants.zero],
        }),
      }
    : {
        transform: [
          {
            translateY: Animated.add(
              dragOffset,
              away.interpolate({
                inputRange: [ValueConstants.zero, ValueConstants.one],
                outputRange: [ValueConstants.zero, panelHeight ?? windowHeight],
              }),
            ),
          },
        ],
      };

  return {
    isMounted,
    scrim,
    panelMotion,
    measure: (event: LayoutChangeEvent) => setPanelHeight(event.nativeEvent.layout.height),
  };
};
