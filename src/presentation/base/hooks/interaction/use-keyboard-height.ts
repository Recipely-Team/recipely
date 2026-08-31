import { useEffect, useState } from 'react';
import { Keyboard, type KeyboardEvent } from 'react-native';
import { isIos, isWeb } from '@infrastructure/constants/platform';
import { ValueConstants } from '@core/constants';

/**
 * How much of the screen the software keyboard is covering right now.
 *
 * @remarks
 * - **A number, not a boolean.** {@link useKeyboardVisible} answers "is it up",
 *   which is enough to drop a padding; a surface pinned to the bottom edge has
 *   to be moved by the exact amount, and that only the event carries.
 * - **`willShow` on iOS, `didShow` on Android**, the same pairing the visible
 *   hook uses: iOS reports the geometry before the animation so a view moving
 *   with it arrives together, and Android has no `will` event to read.
 * - **Zero on web**, where there is no software keyboard to account for — the
 *   browser scrolls the focused field into view itself.
 * - **Why not `KeyboardAvoidingView`.** It pads a view it CONTAINS. The
 *   assistant's sheet and the wide panel are absolutely positioned overlays
 *   over the whole app, mounted at the root beside the screen they float over;
 *   there is no layout box to pad. What they need is their `bottom` offset, and
 *   that is a number.
 */
export const useKeyboardHeight = (): number => {
  const [keyboardHeight, setKeyboardHeight] = useState(ValueConstants.zero);

  useEffect(() => {
    if (isWeb()) return;
    const showEvent = isIos() ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = isIos() ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (event: KeyboardEvent) => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(ValueConstants.zero);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return keyboardHeight;
};
