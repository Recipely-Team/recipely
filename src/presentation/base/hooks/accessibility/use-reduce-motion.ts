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
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (active) setReduceMotion(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  return reduceMotion;
};
