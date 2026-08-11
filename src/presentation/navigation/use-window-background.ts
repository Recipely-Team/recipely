import { useEffect } from 'react';
import * as SystemUI from 'expo-system-ui';

/**
 * Paints the native window behind the whole app in the active theme's
 * background.
 *
 * @remarks
 * - **Why it is visible at all** — the tab bar is a sibling of the `Stack`, not
 *   a navigator of its own, and it unmounts the instant the route becomes a
 *   tab-less one. The strip it occupied is vacated immediately while the stack
 *   transition is still running, so for the length of that animation something
 *   behind the app shows through. Unset, that is the platform default: black on
 *   Android. Reported as "weird things happen moving between screens".
 * - **Why not only a container `View`** — the app paints one too, and that is
 *   the fix for the composition. This is the floor under it: the first frame
 *   before React has mounted anything, an overscroll past the app's own
 *   surface, and any gap a future layout opens all land here instead of on the
 *   platform default.
 * - **Called on every change** — the window colour is native state, so it does
 *   not re-derive when the user picks another theme; it has to be pushed.
 */
export const useWindowBackground = (background: string): void => {
  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(background);
  }, [background]);
};
