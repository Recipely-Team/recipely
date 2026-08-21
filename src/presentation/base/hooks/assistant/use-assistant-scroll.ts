import { machineLower } from '@presentation/base/hooks/assistant/args/machine-case';
import { useCallback } from 'react';
import { AssistantAction } from '@domain/assistant/actions/assistant-action-type';
import type { AssistantActionResultType } from '@domain/assistant/actions/assistant-action-result';
import { useAssistantAction } from '@presentation/base/hooks/assistant/use-assistant-action';
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
  scrollBy: (direction: AssistantScrollDirectionType) => void,
): void => {
  useAssistantAction(
    AssistantAction.Scroll,
    useCallback(
      async (arg?: string): Promise<AssistantActionResultType> => {
        const direction = machineLower(arg ?? AssistantScrollDirection.Down);
        if (!isDirection(direction)) return { ok: false, error: 'unknown_direction' };

        scrollBy(direction);
        return { ok: true };
      },
      [scrollBy],
    ),
  );
};

function isDirection(value: string): value is AssistantScrollDirectionType {
  return (Object.values(AssistantScrollDirection) as string[]).includes(value);
}
