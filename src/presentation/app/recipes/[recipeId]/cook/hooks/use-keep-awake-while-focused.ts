import { useEffect } from 'react';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useIsScreenFocused } from '@presentation/base/hooks/assistant/use-is-screen-focused';

/** The keep-awake tag cook mode holds; its own, so releasing it frees no one else's. */
const COOK_MODE_KEEP_AWAKE_TAG = 'cook-mode';

/**
 * Keeps the screen on while cook mode is the screen in front.
 *
 * @remarks
 * - **Focus, not mount.** The stack keeps a screen mounted under the next one
 *   it pushes; a lock held for the mount would keep the phone awake on every
 *   screen after it, draining the battery for a recipe nobody is looking at.
 * - **Not `useKeepAwake`**: that hook holds the lock for the whole mount and
 *   cannot be switched off on blur.
 * - **A refused lock is not an error** (the web without the Wake Lock API, a
 *   browser tab in the background); the screen just dims as it always does.
 */
export const useKeepAwakeWhileFocused = (): void => {
  const isFocused = useIsScreenFocused();

  useEffect(() => {
    if (!isFocused) return;
    activateKeepAwakeAsync(COOK_MODE_KEEP_AWAKE_TAG).catch(() => undefined);
    return () => {
      void deactivateKeepAwake(COOK_MODE_KEEP_AWAKE_TAG).catch(() => undefined);
    };
  }, [isFocused]);
};
