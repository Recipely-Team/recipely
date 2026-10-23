import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * Whether VoiceOver / TalkBack is running.
 *
 * @remarks
 * - **Subscribes rather than reading once**, like `useReduceMotion`: a screen
 *   reader is switched on and off mid-session.
 * - **Answers `false` until the platform answers** — the common case.
 */
export const useScreenReaderEnabled = (): boolean => {
  const [isEnabled, setEnabled] = useState(false);

  useEffect(() => {
    let isActive = true;
    void AccessibilityInfo.isScreenReaderEnabled().then((isOn) => {
      if (isActive) setEnabled(isOn);
    });
    const subscription = AccessibilityInfo.addEventListener('screenReaderChanged', setEnabled);
    return () => {
      isActive = false;
      subscription.remove();
    };
  }, []);

  return isEnabled;
};
