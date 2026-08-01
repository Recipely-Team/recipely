import { useEffect, useState } from 'react';
import { isIos, isWeb } from '@infrastructure/constants/platform';
import { Keyboard } from 'react-native';

/**
 * Tracks whether the software keyboard is currently visible.
 *
 * WHY: `KeyboardAvoidingView`'s `behavior="padding"` already pads its content
 * up by exactly the keyboard's height once shown — that padding alone is
 * flush with the keyboard's top edge, no safe-area buffer needed on top of it
 * (the keyboard already occludes the home indicator area). A sticky bottom
 * bar that *also* adds a fixed `insets.bottom` for the keyboard-hidden state
 * ends up double-padded while the keyboard is up, showing a visible gap
 * above it. Callers should zero out that extra inset while this is `true`.
 *
 * Web has no software keyboard to track, so this always reports `false` there.
 */
export const useKeyboardVisible = (): boolean => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isWeb()) return;
    const showEvent = isIos() ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = isIos() ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, () => setVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return visible;
};
