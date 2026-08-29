import { useCallback, useMemo, useRef } from 'react';
import { useWindowDimensions } from 'react-native';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import type { AssistantScrollableProps } from '@presentation/base/hooks/assistant/actions/assistant-scrollable-props';
import { useAssistantScroll } from '@presentation/base/hooks/assistant/actions/use-assistant-scroll';
import {
  SCROLL_EVENT_THROTTLE_MS,
  scrollTargetFor,
} from '@presentation/base/hooks/assistant/args/scrolling/scroll-tuning';
import type { AssistantScrollDirectionType } from '@presentation/base/hooks/assistant/args/scrolling/assistant-scroll-direction';
import { moveScrollTo } from '@presentation/base/hooks/assistant/args/scrolling/move-scroll-to';
import { ValueConstants } from '@core/constants';

/** The handle the props carry, named here so the ref that holds it has a type. */
type ScrollHandleType = Parameters<AssistantScrollableProps['ref']>[0];

/**
 * Makes a screen's list something the assistant can move.
 *
 * @remarks
 * - **`scroll` is registered by whoever can perform it**, and for a long time
 *   that was two screens out of nine: "aşağı kaydır" on My Recipes, on the
 *   notifications list or on a settings page answered `unavailable_here` while
 *   the user was looking at a scrollbar. A screen adopts this hook and spreads
 *   what it returns onto its list; nothing else is needed.
 * - **The offset is tracked here because a list will not tell you.** Neither
 *   `FlatList` nor `ScrollView` can be asked where it currently is, and a
 *   relative step needs to know — so `onScroll` keeps the last value in a ref
 *   rather than in state, which would re-render the screen on every frame of
 *   every thumb scroll.
 * - **One props object, spread onto the list.** Screens with several branches
 *   (My Recipes has four) attach the same object to each, so whichever one is
 *   rendered is the one that moves.
 */
export const useAssistantScrollable = (
  /**
   * False when the caller is not rendering a scrollable right now — a shared
   * container that can be either. Registering anyway would answer "scrolled"
   * for a screen where nothing moved.
   */
  isEnabled = true,
): AssistantScrollableProps => {
  const { height } = useWindowDimensions();
  const handle = useRef<ScrollHandleType>(null);
  const offset = useRef(ValueConstants.zero);

  const scrollBy = useCallback(
    (direction: AssistantScrollDirectionType): boolean =>
      moveScrollTo(handle.current, scrollTargetFor(direction, offset.current, height)),
    [height],
  );

  useAssistantScroll(scrollBy, isEnabled);

  // Memoised: the object is spread onto a list, so a fresh identity every
  // render would hand the list a new `ref` callback each time — React detaches
  // and re-attaches on that, which is a re-mount of the ref on every keystroke
  // a screen above it takes.
  return useMemo(
    () => ({
      ref: (instance: ScrollHandleType): void => {
        handle.current = instance;
      },
      onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>): void => {
        offset.current = event.nativeEvent.contentOffset.y;
      },
      scrollEventThrottle: SCROLL_EVENT_THROTTLE_MS,
    }),
    [],
  );
};
