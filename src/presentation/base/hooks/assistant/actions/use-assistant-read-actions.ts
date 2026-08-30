import { useCallback, useRef } from 'react';
import { AssistantAction } from '@domain/assistant/actions/assistant-action-type';
import type { AssistantActionResultType } from '@domain/assistant/actions/assistant-action-result';
import { machineLower } from '@presentation/base/hooks/assistant/args/resolving/machine-case';
import { StepCursor } from '@presentation/base/hooks/assistant/args/resolving/step-cursor';
import { useAssistantAction } from '@presentation/base/hooks/assistant/actions/use-assistant-action';
import { CharConstants, ValueConstants } from '@core/constants';

/** Joins ingredient lines into one spoken list. */
const INGREDIENT_SEPARATOR = CharConstants.commaSpace;

/**
 * Reads a recipe's steps and ingredients out loud, wherever one is on screen.
 *
 * @remarks
 * - **Shared by the published recipe and the draft**, which is the whole
 *   reason it left the recipe hook. Asked to read a draft that was open in
 *   front of them, the user was told to save it first and open it again —
 *   because these two actions were registered by the detail screen and by
 *   nothing else. A draft has ingredients and steps the moment it is
 *   generated; there was never a reason it could not be read.
 * - **The cursor lives here, not in the model.** "Next" is what a cook says,
 *   and where the model thinks it had got to is exactly what a ten-minute
 *   reconnect loses.
 * - **Reading is not ticking.** `readIngredients` exists because a model with
 *   only `toggleIngredient` to hand ticked all eleven of them off when asked to
 *   read the list.
 */
export const useAssistantReadActions = (
  ingredients: readonly string[],
  instructions: readonly string[],
  isEnabled = true,
): void => {
  const stepCursor = useRef(ValueConstants.minusOne);

  useAssistantAction(
    AssistantAction.ReadStep,
    useCallback(
      async (arg?: string): Promise<AssistantActionResultType> => {
        const asked = machineLower(arg ?? StepCursor.Next);
        const index =
          asked === StepCursor.Next
            ? stepCursor.current + ValueConstants.one
            : asked === StepCursor.Previous
              ? stepCursor.current - ValueConstants.one
              : asked === StepCursor.Current
                ? Math.max(stepCursor.current, ValueConstants.zero)
                : Number.parseInt(asked, 10) - ValueConstants.one;

        const step = instructions[index];
        if (step === undefined) return { ok: false, error: 'no_such_step' };

        stepCursor.current = index;
        // The step text is one of the few places a tool result carries content
        // rather than a count, and it has to: the model is about to read it
        // aloud and has no other way to know what it says.
        return {
          ok: true,
          title: step,
          n: { step: index + ValueConstants.one, of: instructions.length },
        };
      },
      [instructions],
    ),
    isEnabled,
  );

  useAssistantAction(
    AssistantAction.ReadIngredients,
    useCallback(async (): Promise<AssistantActionResultType> => {
      if (ingredients.length === ValueConstants.zero) return { ok: false, error: 'no_ingredients' };
      return {
        ok: true,
        title: ingredients.join(INGREDIENT_SEPARATOR),
        n: { ingredients: ingredients.length },
      };
    }, [ingredients]),
    isEnabled,
  );
};
