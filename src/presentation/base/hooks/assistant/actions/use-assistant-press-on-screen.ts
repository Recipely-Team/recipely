import { useCallback } from 'react';
import { CharConstants } from '@core/constants';
import { AssistantAction } from '@domain/assistant/actions/assistant-action-type';
import { AssistantActionError } from '@domain/assistant/actions/assistant-action-error';
import type { AssistantActionResultType } from '@domain/assistant/actions/assistant-action-result';
import { ScreenPressOutcome } from '@application/assistant/screen/screen-press-outcome';
import { useAssistantAction } from '@presentation/base/hooks/assistant/actions/use-assistant-action';
import { useStores } from '@presentation/bootstrap/use-stores';

const LIST_SEPARATOR = ' | ';

/**
 * `pressOnScreen`: the assistant taps a control the user can see, by its label.
 *
 * @remarks
 * - **Any screen, any sheet, any dialog**: every `Pressable` registers itself,
 *   so a button no action was written for is still reachable by voice.
 * - **Never a guess.** Two matching buttons come back as a list to ask about;
 *   none comes back with the buttons that are there.
 */
export const useAssistantPressOnScreen = (): void => {
  const { assistantActionRegistry: registry } = useStores();

  useAssistantAction(
    AssistantAction.PressOnScreen,
    useCallback(async (arg?: string): Promise<AssistantActionResultType> => {
      const pressed = registry.screenElements.press(arg ?? CharConstants.empty);
      if (pressed.outcome === ScreenPressOutcome.Pressed) return { ok: true, summary: pressed.label ?? CharConstants.empty };
      if (pressed.outcome === ScreenPressOutcome.Ambiguous) {
        return { ok: false, error: AssistantActionError.AmbiguousControl, summary: pressed.candidates.join(LIST_SEPARATOR) };
      }
      return { ok: false, error: AssistantActionError.NotFound, summary: registry.screenElements.snapshot().controls.join(LIST_SEPARATOR) };
    }, [registry]),
  );
};
