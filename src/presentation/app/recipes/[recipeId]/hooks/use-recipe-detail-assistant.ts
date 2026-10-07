import { useCallback, useMemo, useRef, useState } from 'react';
import { Dimensions } from 'react-native';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { recipeFacts } from '@presentation/app/recipes/[recipeId]/model/recipe-facts';
import { usePortionScaling } from '@presentation/app/recipes/[recipeId]/hooks/use-portion-scaling';
import { spokenIngredientLines } from '@presentation/app/recipes/[recipeId]/model/portions/spoken-ingredient-lines';
import { cookTimerId } from '@presentation/app/recipes/[recipeId]/model/cook-timer-slot';
import type { UseRecipeDetailResult } from '@presentation/app/recipes/[recipeId]/model/use-recipe-detail-result';
import { useAssistantConfirmation } from '@presentation/base/hooks/assistant/actions/use-assistant-confirmation';
import { useAssistantRecipeActions } from '@presentation/base/hooks/assistant/actions/use-assistant-recipe-actions';
import { useAssistantScroll } from '@presentation/base/hooks/assistant/actions/use-assistant-scroll';
import type { AssistantScrollDirectionType } from '@presentation/base/hooks/assistant/args/scrolling/assistant-scroll-direction';
import { moveScrollTo } from '@presentation/base/hooks/assistant/args/scrolling/move-scroll-to';
import { scrollTargetFor } from '@presentation/base/hooks/assistant/args/scrolling/scroll-tuning';
import { useRecipeTimer } from '@presentation/base/hooks/timers/use-recipe-timer';
import { CharConstants, ValueConstants } from '@core/constants';

interface RecipeDetailAssistant {
  unsavePending: boolean;
  confirmUnsave: () => void;
  cancelUnsave: () => void;
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
}

/**
 * Wires the recipe detail screen to the voice assistant: its actions, the cook timer,
 * spoken confirmations and scrolling.
 *
 * @remarks
 * - **Unsave asks first**, so the pending unsave lives here and the screen's sheet reads it.
 * - **It reads the lines the screen shows**: scaled to the chosen servings and
 *   units (`usePortionScaling`), headings read as their labels.
 * - **One confirmation at a time**: delete is a modal over everything, and sheets drawn later
 *   (share, sign-in) take the spoken answer away from unsave.
 */
export const useRecipeDetailAssistant = (vm: UseRecipeDetailResult): RecipeDetailAssistant => {
  const [unsavePending, setUnsavePending] = useState(false);
  const scrollOffset = useRef(ValueConstants.zero);
  const scrollDetail = useCallback(
    (direction: AssistantScrollDirectionType): boolean =>
      moveScrollTo(
        vm.scrollViewRef.current,
        scrollTargetFor(direction, scrollOffset.current, Dimensions.get('window').height),
      ),
    [vm.scrollViewRef],
  );
  const portions = usePortionScaling(vm.recipe ?? null);
  const ingredients = useMemo(() => spokenIngredientLines(portions.ingredients), [portions.ingredients]);
  const cookTimer = useRecipeTimer({
    timerId: cookTimerId(vm.recipeId),
    recipeId: vm.recipeId,
    recipeName: vm.recipe?.name ?? CharConstants.empty,
    minutes: vm.recipe?.cookTimeMinutes ?? ValueConstants.zero,
  });
  useAssistantRecipeActions({
    recipeId: vm.recipeId,
    recipeName: vm.recipe?.name ?? CharConstants.empty,
    ingredients,
    instructions: vm.recipe?.instructions ?? [],
    cookTimeMinutes: vm.recipe?.cookTimeMinutes ?? ValueConstants.zero,
    facts: recipeFacts(vm.recipe ?? null),
    // "Who said what", for the reading only — the screen line carries the count.
    comments: (vm.commentState?.items ?? []).map(
      ({ comment }) => `${comment.authorDisplayName}: ${comment.body}`,
    ),
    isOwner: vm.isOwner,
    onPostComment: vm.onPostComment,
    onOpenDelete: vm.onOpenDelete,
    onRequestUnsave: () => setUnsavePending(true),
    onOpenShare: vm.onOpenShare,
    onCopyToDraft: vm.onCopyToDraft,
    onStartCookTimer: cookTimer.start,
    onPauseTimer: cookTimer.pause,
    onResumeTimer: () => cookTimer.resume(),
    onStopTimer: cookTimer.stop,
    checkedIngredients: vm.checkedIngredients,
    completedSteps: vm.completedSteps,
    onToggleIngredient: vm.onToggleIngredient,
    onToggleStep: vm.onToggleStep,
  });

  const confirmUnsave = (): void => {
    setUnsavePending(false);
    vm.onToggleSave();
  };
  const cancelUnsave = (): void => setUnsavePending(false);

  useAssistantConfirmation(vm.showDeleteSheet, vm.onConfirmDelete, vm.onCloseDelete);
  useAssistantConfirmation(
    unsavePending && !vm.showDeleteSheet && !vm.shareOpen && !vm.promptVisible,
    confirmUnsave,
    cancelUnsave,
  );
  useAssistantScroll(scrollDetail);

  return {
    unsavePending,
    confirmUnsave,
    cancelUnsave,
    onScroll: (event) => {
      scrollOffset.current = event.nativeEvent.contentOffset.y;
    },
  };
};
