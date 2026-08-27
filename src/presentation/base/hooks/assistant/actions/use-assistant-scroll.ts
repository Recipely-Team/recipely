import { machineLower } from '@presentation/base/hooks/assistant/args/machine-case';
import { useCallback } from 'react';
import { AssistantAction } from '@domain/assistant/actions/assistant-action-type';
import type { AssistantActionResultType } from '@domain/assistant/actions/assistant-action-result';
import { useAssistantAction } from '@presentation/base/hooks/assistant/actions/use-assistant-action';
import {
  AssistantScrollDirection,
  type AssistantScrollDirectionType,
} from '@presentation/base/hooks/assistant/args/assistant-scroll-direction';

/**
 * Lets the assistant scroll whichever screen registered it.
 *
 * @remarks
 * - **The screen decides what a step is**, because only it knows how tall its
 *   rows are — this hook carries the intent, not a pixel count.
 * - **Registered by each scrolling screen**, so the action is unavailable — and
 *   says so — on a screen with nothing to scroll.
 */
export const useAssistantScroll = (
  scrollBy: (direction: AssistantScrollDirectionType) => boolean,
  /** False where the screen has nothing scrollable mounted right now. */
  isEnabled = true,
): void => {
  useAssistantAction(
    AssistantAction.Scroll,
    useCallback(
      async (arg?: string): Promise<AssistantActionResultType> => {
        const direction = machineLower(arg ?? AssistantScrollDirection.Down);
        if (!isDirection(direction)) return { ok: false, error: 'unknown_direction' };

        // Reported success unconditionally until a user found the screens
        // where nothing was attached to move: the feed's wide-layout and
        // search branches both answered "kaydırdım" over a list that had not
        // budged. The handler now says what happened.
        if (!scrollBy(direction)) return { ok: false, error: 'nothing_to_scroll' };
        return { ok: true };
      },
      [scrollBy],
    ),
    isEnabled,
  );
};

function isDirection(value: string): value is AssistantScrollDirectionType {
  return (Object.values(AssistantScrollDirection) as string[]).includes(value);
}
