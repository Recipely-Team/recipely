import { useEffect, useEffectEvent } from 'react';
import { useIsScreenFocused } from '@presentation/base/hooks/assistant/use-is-screen-focused';
import { useStores } from '@presentation/bootstrap/use-stores';

/**
 * Tells the assistant what the calling screen is showing.
 *
 * @remarks
 * - **The describer is called at read time, not at registration.** A screen's
 *   list changes constantly — a fetch lands, a filter applies, a tab moves —
 *   and re-registering on every one of those would be a subscription with a
 *   registry on the other end of it. As an Effect Event, the effect runs once
 *   per focus and still reads the current render's data.
 * - **Innermost wins.** A recipe pushed over the feed describes itself; on the
 *   way back the feed's own describer is what remains. Same rule as handlers,
 *   for the same reason: expo-router leaves the screen underneath mounted.
 */
export const useAssistantScreenContent = (describe: () => string): void => {
  const { assistantActionRegistry } = useStores();
  const isFocused = useIsScreenFocused();
  const current = useEffectEvent(describe);

  // Focus, not mount: screens under the stack stay mounted.
  useEffect(() => {
    if (!isFocused) return;
    return assistantActionRegistry.registerScreenContent(() => current());
  }, [assistantActionRegistry, isFocused]);
};
