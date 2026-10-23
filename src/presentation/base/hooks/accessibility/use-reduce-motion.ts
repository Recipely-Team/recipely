import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * Whether the OS has been asked to keep animation to a minimum.
 *
 * @remarks
 * - **It subscribes rather than reading once.** The setting is a toggle a user
 *   reaches for mid-session — often because something on screen is already
 *   making them unwell — so a value read at mount would keep moving until the
 *   next launch.
 * - **It answers `false` until the platform answers.** The query is async and
 *   the honest default is the common case; starting at `true` would make every
 *   screen flash from still to animated one frame in.
 */
export const useReduceMotion = (): boolean => {
  const [shouldReduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let isActive = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((isEnabled) => {
      if (isActive) setReduceMotion(isEnabled);
    });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      isActive = false;
      subscription.remove();
    };
  }, []);

  return shouldReduceMotion;
};
