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
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isScreenReaderEnabled().then((on) => {
      if (active) setEnabled(on);
    });
    const subscription = AccessibilityInfo.addEventListener('screenReaderChanged', setEnabled);
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  return enabled;
};
