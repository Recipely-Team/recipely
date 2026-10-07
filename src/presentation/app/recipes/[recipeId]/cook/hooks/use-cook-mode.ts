import { useCallback, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { useStores } from '@presentation/bootstrap/use-stores';
import { RoutePaths } from '@presentation/base/constants';
import { isString } from '@core/guards/type-guards';
import { CharConstants, ValueConstants } from '@core/constants';
import { usePortionScaling } from '@presentation/app/recipes/[recipeId]/hooks/use-portion-scaling';
import { useCookRecipe } from '@presentation/app/recipes/[recipeId]/cook/hooks/use-cook-recipe';
import { useStepNavigation } from '@presentation/app/recipes/[recipeId]/cook/hooks/use-step-navigation';
import { CookRecipeStatus } from '@presentation/app/recipes/[recipeId]/cook/model/cook-recipe-status';
import { stepDurationMinutes } from '@presentation/app/recipes/[recipeId]/cook/model/step-duration-minutes';
import type { UseCookModeResult } from '@presentation/app/recipes/[recipeId]/cook/model/use-cook-mode-result';

/** Nothing ticked and nothing to list: shared so selectors stay stable. */
const NONE: readonly never[] = [];

/**
 * Drives cook mode: the recipe, the step on screen, the ticks and the exits.
 *
 * @remarks
 * - **The ticks are the recipe page's ticks** (`stepProgressStore`): a step
 *   done here reads as done there.
 * - **The ingredients are the recipe page's lines**: at the servings and units
 *   chosen there (`usePortionScaling`), for the sheet, its shopping button and the assistant.
 * - **"Next" means "done with this one".** Moving forward ticks the step being
 *   left — the cook has finished it — and on the last step it finishes cook
 *   mode. Going back ticks nothing.
 * - **Exit goes back when there is somewhere to go back to**, and otherwise
 *   (a reload, a deep link) to the recipe page rather than to nothing.
 */
export const useCookMode = (): UseCookModeResult => {
  const router = useRouter();
  const params = useLocalSearchParams<{ recipeId: string }>();
  const recipeId = isString(params.recipeId) ? params.recipeId : CharConstants.empty;
  const { stepProgressStore, recipeDetailStore } = useStores();
  const state = useCookRecipe(recipeId);
  const recipe = state.status === CookRecipeStatus.Ready || state.status === CookRecipeStatus.Empty ? state.recipe : null;
  const steps = recipe?.instructions ?? NONE;
  const portions = usePortionScaling(recipe);
  const navigation = useStepNavigation(steps.length);
  const completedSteps = stepProgressStore((s) => s.byRecipe[recipeId]) ?? NONE;
  const toggleStep = stepProgressStore((s) => s.toggleStep);
  const setStepDone = stepProgressStore((s) => s.setStepDone);
  const load = recipeDetailStore((s) => s.load);
  const [isIngredientsOpen, setIngredientsOpen] = useState(false);

  const currentStep = steps[navigation.index] ?? CharConstants.empty;

  const onExit = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace(RoutePaths.recipeDetail(recipeId) as Href);
  }, [router, recipeId]);

  const onNext = useCallback(() => {
    if (steps.length === ValueConstants.zero) return;
    setStepDone(recipeId, navigation.index, true);
    if (navigation.isLast) onExit();
    else navigation.next();
  }, [steps.length, setStepDone, recipeId, navigation, onExit]);

  const onSwipe = useCallback(
    (direction: number) => {
      if (direction > ValueConstants.zero) navigation.next();
      else navigation.previous();
    },
    [navigation],
  );

  return {
    recipeId,
    state,
    recipeName: recipe?.name ?? CharConstants.empty,
    steps,
    ingredients: portions.ingredients,
    navigation,
    completedSteps,
    currentStep,
    stepMinutes: currentStep.length > ValueConstants.zero ? stepDurationMinutes(currentStep) : null,
    onToggleStep: useCallback((index: number) => toggleStep(recipeId, index), [toggleStep, recipeId]),
    onNext,
    onPrevious: navigation.previous,
    onSwipe,
    isIngredientsOpen,
    openIngredients: useCallback(() => setIngredientsOpen(true), []),
    closeIngredients: useCallback(() => setIngredientsOpen(false), []),
    onExit,
    onRetry: useCallback(() => void load(recipeId), [load, recipeId]),
  };
};
