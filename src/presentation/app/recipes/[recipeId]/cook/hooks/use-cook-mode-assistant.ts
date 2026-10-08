import { useCallback, useMemo } from 'react';
import { AssistantAction } from '@domain/assistant/actions/assistant-action-type';
import { AssistantActionError } from '@domain/assistant/actions/assistant-action-error';
import type { AssistantActionResultType } from '@domain/assistant/actions/assistant-action-result';
import { useAssistantAction } from '@presentation/base/hooks/assistant/actions/use-assistant-action';
import { useAssistantScreenContent } from '@presentation/base/hooks/assistant/use-assistant-screen-content';
import { useAssistantScreenReading } from '@presentation/base/hooks/assistant/use-assistant-screen-reading';
import { recipeReading } from '@presentation/base/hooks/assistant/args/describing/recipe-reading';
import { SCREEN_PART_SEPARATOR } from '@presentation/base/hooks/assistant/args/describing/screen-line';
import { rowAt } from '@presentation/base/hooks/assistant/args/resolving/row-at';
import { startTimer } from '@presentation/base/timers/timer-controls';
import { CharConstants, ValueConstants } from '@core/constants';
import { stepTimerId } from '@presentation/base/timers/step-timer-id';
import { resolveStepTarget } from '@presentation/app/recipes/[recipeId]/cook/model/resolve-step-target';
import { spokenIngredientLines } from '@presentation/app/recipes/[recipeId]/model/portions/spoken-ingredient-lines';
import type { UseCookModeResult } from '@presentation/app/recipes/[recipeId]/cook/model/use-cook-mode-result';

/**
 * What the voice assistant can do in cook mode: next / previous / repeat a
 * step, start its timer, read the ingredients, tick a step.
 *
 * @remarks
 * - **No new words.** "Next step", "go back" and "read that again" are
 *   `readStep` with `next` / `previous` / `current`, the words the model
 *   already has for walking a recipe; here they also MOVE the screen, so what
 *   the cook hears and what the cook sees are the same step.
 * - **"Next" is the Next button**: it ticks the step being left. Past the last
 *   step it answers `no_such_step` rather than leaving cook mode on a word.
 * - **`startTimer` is the step's timer**, the one the step names ("simmer
 *   10 minutes"), with the button's id so voice and tap start one countdown.
 *   A step that names no time answers `no_cook_time`.
 * - **Focus-scoped** like every handler (`useAssistantAction`), so the recipe
 *   page underneath does not answer while cook mode is in front; pause,
 *   resume and stop fall through to the app-wide timer actions.
 */
export const useCookModeAssistant = (vm: UseCookModeResult): void => {
  const { recipeId, recipeName, steps, navigation, completedSteps, stepMinutes } = vm;
  const ingredients = useMemo(() => spokenIngredientLines(vm.ingredients), [vm.ingredients]);
  const isReady = steps.length > ValueConstants.zero;

  useAssistantScreenContent(() =>
    [
      `cooking=${recipeName}`,
      `step=${String(navigation.index + ValueConstants.one)}`,
      `steps=${String(steps.length)}`,
      `done=${String(completedSteps.filter(Boolean).length)}`,
      `stepTimerMin=${stepMinutes === null ? CharConstants.empty : String(stepMinutes)}`,
    ].join(SCREEN_PART_SEPARATOR),
  );

  useAssistantScreenReading(() =>
    recipeReading(recipeName, ingredients, steps, [
      `on screen: step ${String(navigation.index + ValueConstants.one)}: ${vm.currentStep}`,
    ]),
  );

  useAssistantAction(
    AssistantAction.ReadStep,
    useCallback(
      async (arg?: string): Promise<AssistantActionResultType> => {
        const target = resolveStepTarget(arg, navigation.index, steps.length);
        const step = target === null ? undefined : steps[target];
        if (target === null || step === undefined) return { ok: false, error: AssistantActionError.NoSuchStep };

        if (target === navigation.index + ValueConstants.one) vm.onNext();
        else navigation.goTo(target);
        return { ok: true, title: step, n: { step: target + ValueConstants.one, of: steps.length } };
      },
      [navigation, steps, vm],
    ),
    isReady,
  );

  useAssistantAction(
    AssistantAction.StartTimer,
    useCallback(async (): Promise<AssistantActionResultType> => {
      if (stepMinutes === null) return { ok: false, error: AssistantActionError.NoCookTime };
      await startTimer(stepTimerId(recipeId, navigation.index, stepMinutes), recipeId, recipeName, stepMinutes);
      return { ok: true, title: recipeName, n: { min: stepMinutes } };
    }, [stepMinutes, recipeId, navigation.index, recipeName]),
    isReady,
  );

  useAssistantAction(
    AssistantAction.ReadIngredients,
    useCallback(async (): Promise<AssistantActionResultType> => {
      if (ingredients.length === ValueConstants.zero) return { ok: false, error: AssistantActionError.NoIngredients };
      return { ok: true, summary: ingredients.join(CharConstants.commaSpace), n: { ingredients: ingredients.length } };
    }, [ingredients]),
    isReady,
  );

  useAssistantAction(
    AssistantAction.ToggleStep,
    useCallback(
      async (arg?: string): Promise<AssistantActionResultType> => {
        const index = arg === undefined ? navigation.index : rowAt(steps, arg);
        if (index === null) return { ok: false, error: AssistantActionError.NotFound };
        vm.onToggleStep(index);
        const wasDone = completedSteps[index] === true;
        const done = completedSteps.filter(Boolean).length + (wasDone ? ValueConstants.minusOne : ValueConstants.one);
        return { ok: true, n: { step: steps.length, done } };
      },
      [navigation.index, steps, vm, completedSteps],
    ),
    isReady,
  );
};
