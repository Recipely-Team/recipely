import { useCallback, useEffect, useRef } from 'react';
import { Keyboard, Platform } from 'react-native';
import type { EmitterSubscription, ScrollView } from 'react-native';
import type { RefObject } from 'react';

/**
 * Returns an `onFocus` handler for an input that sits at the END of a
 * ScrollView (e.g. the recipe-detail comment box) and must stay visible above
 * the software keyboard.
 *
 * A fixed-delay `setTimeout(scrollToEnd)` races the keyboard animation and
 * the KeyboardAvoider's padding relayout, so depending on where the user had
 * scrolled the input could end up hidden behind the keyboard. Instead this
 * waits for `keyboardDidShow` — the moment the keyboard (and therefore the
 * avoider padding) has actually settled — and only then scrolls. When the
 * keyboard is already open (focus hopping between inputs) or on web (no RN
 * keyboard events; the browser pans natively but the ScrollView still needs
 * to reveal the input) it scrolls on the next frames instead.
 */
export const useScrollToEndOnKeyboard = (
  scrollRef: RefObject<ScrollView | null>,
): (() => void) => {
  const subscription = useRef<EmitterSubscription | null>(null);

  // Drop a pending listener on unmount (e.g. focus, then navigate away
  // before the keyboard ever appears — hardware-keyboard devices).
  useEffect(
    () => () => {
      subscription.current?.remove();
      subscription.current = null;
    },
    [],
  );

  return useCallback(() => {
    const scrollToEnd = (): void => {
      // Double rAF: the avoider applies its padding in reaction to the same
      // keyboard event, so give layout one extra frame to settle first.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
      });
    };

    if (Platform.OS === 'web' || Keyboard.isVisible()) {
      scrollToEnd();
      return;
    }

    subscription.current?.remove();
    subscription.current = Keyboard.addListener('keyboardDidShow', () => {
      subscription.current?.remove();
      subscription.current = null;
      scrollToEnd();
    });
  }, [scrollRef]);
};
