import { useCallback, useEffect, useRef } from 'react';
import { AssistantAction } from '@domain/assistant/actions/assistant-action-type';
import type { AssistantActionResultType } from '@domain/assistant/actions/assistant-action-result';
import { machineLower } from '@presentation/base/hooks/assistant/args/resolving/machine-case';
import { StepCursor } from '@presentation/base/hooks/assistant/args/resolving/step-cursor';
import { useAssistantAction } from '@presentation/base/hooks/assistant/actions/use-assistant-action';
import { CharConstants, ValueConstants } from '@core/constants';

/** Joins ingredient lines into one spoken list. */
const INGREDIENT_SEPARATOR = CharConstants.commaSpace;

/**
 * How long a read waits for a screen that is still loading, and how often it
 * looks. The assistant opens a recipe and is asked to read it in the same
 * breath — "tarifi aç ve yapılışını oku" — and the screen has not finished
 * loading when the second half arrives.
 */
const CONTENT_WAIT_MS = 3_000;
const CONTENT_POLL_MS = 100;

/** Resolves once there is something to read, or when the wait runs out. */
async function waitForContent(has: () => boolean): Promise<void> {
  const until = Date.now() + CONTENT_WAIT_MS;
  while (!has() && Date.now() < until) {
    await new Promise((resolve) => setTimeout(resolve, CONTENT_POLL_MS));
  }
}

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
 * - **A screen that is still loading is not a screen with nothing on it.**
 *   Opened by the assistant and asked to read in the same turn, these answered
 *   `no_such_step` before the recipe had arrived, and the model told the user
 *   it could not read the recipe at all. Each read waits briefly for content
 *   and reads the LATEST lines rather than the ones its closure was made with.
 */
export const useAssistantReadActions = (
  ingredients: readonly string[],
  instructions: readonly string[],
  isEnabled = true,
): void => {
  const stepCursor = useRef(ValueConstants.minusOne);
  // The lines as they are NOW: a read that waited must not answer from the
  // empty arrays its callback closed over while the screen was loading.
  const latest = useRef({ ingredients, instructions });
  useEffect(() => {
    latest.current = { ingredients, instructions };
  }, [ingredients, instructions]);

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

        await waitForContent(() => latest.current.instructions.length > ValueConstants.zero);
        const lines = latest.current.instructions;
        const step = lines[index];
        if (step === undefined) return { ok: false, error: 'no_such_step' };

        stepCursor.current = index;
        // The step text is one of the few places a tool result carries content
        // rather than a count, and it has to: the model is about to read it
        // aloud and has no other way to know what it says.
        return {
          ok: true,
          title: step,
          n: { step: index + ValueConstants.one, of: lines.length },
        };
      },
      [],
    ),
    isEnabled,
  );

  useAssistantAction(
    AssistantAction.ReadIngredients,
    useCallback(async (): Promise<AssistantActionResultType> => {
      await waitForContent(() => latest.current.ingredients.length > ValueConstants.zero);
      const lines = latest.current.ingredients;
      if (lines.length === ValueConstants.zero) return { ok: false, error: 'no_ingredients' };
      return {
        ok: true,
        title: lines.join(INGREDIENT_SEPARATOR),
        n: { ingredients: lines.length },
      };
    }, []),
    isEnabled,
  );
};
