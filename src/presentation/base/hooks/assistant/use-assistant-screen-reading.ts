import { useEffect, useRef } from 'react';
import { useStores } from '@presentation/bootstrap/use-stores';

/**
 * Tells the assistant what the calling screen would say if read out loud.
 *
 * @remarks
 * - **Not the screen line.** {@link useAssistantScreenContent} registers the
 *   handful of counts that ride inside every tool result; this registers the
 *   whole of what is on screen, and it is read only when the user asks for it
 *   — `readScreen`, once, rather than on every turn.
 * - **Which is why it may be long.** The draft's ingredients and steps, the
 *   recipe's numbers, the settings' current values: a blind user asking "bu
 *   sayfada ne var" gets the page, not a summary of it.
 * - **Called at read time**, so a describer closes over the current render's
 *   data and the screen never re-registers as its list changes — same
 *   arrangement, and the same reason, as the screen line's.
 * - **Innermost wins.** A recipe pushed over the feed reads itself; on the way
 *   back the feed reads itself again.
 */
export const useAssistantScreenReading = (read: () => string): void => {
  const { assistantActionRegistry } = useStores();
  const latest = useRef(read);
  latest.current = read;

  useEffect(
    () => assistantActionRegistry.registerScreenReading(() => latest.current()),
    [assistantActionRegistry],
  );
};
