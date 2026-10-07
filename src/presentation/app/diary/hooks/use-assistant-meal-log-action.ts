import { useCallback } from 'react';
import { CharConstants } from '@core/constants';
import { isBlank } from '@core/guards/type-guards';
import { AssistantAction } from '@domain/assistant/actions/assistant-action-type';
import { AssistantActionError } from '@domain/assistant/actions/assistant-action-error';
import type { AssistantActionResultType } from '@domain/assistant/actions/assistant-action-result';
import { useAssistantAction } from '@presentation/base/hooks/assistant/actions/use-assistant-action';

/**
 * `logMeal` by voice ("log my meal: menemen and two slices of bread"): opens
 * Add food on its meal panel with the description, which the panel reads at
 * once into the confirm list. Nothing is logged by the assistant — the user
 * checks the amounts and taps "Add to diary", so the answer tells the model
 * to hand over rather than to report a logged meal.
 */
export const useAssistantMealLogAction = (openMealLog: (text: string) => void): void => {
  useAssistantAction(
    AssistantAction.LogMeal,
    useCallback(
      async (arg?: string): Promise<AssistantActionResultType> => {
        const text = (arg ?? CharConstants.empty).trim();
        if (isBlank(text)) return { ok: false, error: AssistantActionError.Empty };
        openMealLog(text);
        return { ok: true, title: 'meal list opened on screen; nothing logged yet — ask the user to check the items and tap Add to diary' };
      },
      [openMealLog],
    ),
  );
};
