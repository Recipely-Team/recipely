import { useCallback, useState } from 'react';
import type { UseGuestGateResult } from '@presentation/app/recipes/shared/model/use-guest-gate-result';

/**
 * Gates a guest-blocked interaction (like, save, comment, ...) behind
 * authentication. Replaces the previous pattern of each handler silently
 * early-returning on `!userId` with a visible "sign in to continue" prompt:
 * call sites wrap the press handler as `onPress={() => requestGate(() => doThing())}`
 * and render a `SignInPromptSheet` bound to `promptVisible` / `closePrompt`.
 */
export const useGuestGate = (userId: string | null): UseGuestGateResult => {
  const [promptVisible, setPromptVisible] = useState(false);
  const [promptMessage, setPromptMessage] = useState<string | undefined>(undefined);

  const requestGate = useCallback(
    (action: () => void, message?: string): void => {
      if (userId !== null) {
        action();
        return;
      }
      setPromptMessage(message);
      setPromptVisible(true);
    },
    [userId],
  );

  const closePrompt = useCallback((): void => {
    setPromptVisible(false);
  }, []);

  return { promptVisible, promptMessage, requestGate, closePrompt };
};
