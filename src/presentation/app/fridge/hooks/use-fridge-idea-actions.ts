import { useCallback } from 'react';
import { useRouter, type Href } from 'expo-router';
import type { FridgeIdea } from '@domain/fridge/ideas/fridge-idea';
import { FridgeDiet } from '@domain/fridge/ideas/fridge-diet';
import { fridgeIdeaPrompt } from '@domain/fridge/ideas/fridge-idea-prompt';
import { useStores } from '@presentation/bootstrap/use-stores';
import { RoutePaths } from '@presentation/base/constants';
import { t } from '@presentation/i18n';
import { showErrorToast, showSuccessToast } from '@presentation/base/feedback/show-toast';
import { dietLabel } from '@presentation/app/fridge/model/filters/diet-label';
import { fridgePromptWording } from '@presentation/app/fridge/model/ideas/fridge-prompt-wording';
import type { FridgeIdeasQuery } from '@presentation/app/fridge/model/ideas/fridge-ideas-query';

/** What an idea card can do. */
interface FridgeIdeaActions {
  /** Opens the AI create flow on this idea: the generating animation, then the draft editor. */
  cook: (idea: FridgeIdea) => void;
  /** Puts the idea's missing items on the shopping list; resolves true when they were added. */
  addMissing: (idea: FridgeIdea) => Promise<boolean>;
}

/**
 * The two things an idea leads to.
 *
 * @remarks
 * - **Cooking an idea is the ordinary AI generate path.** The idea becomes a
 *   prompt (`fridgeIdeaPrompt`, in the user's language) and opens the create
 *   screen with it — the same generating animation, the same draft editor, AI
 *   badge, refine dock and Save as a typed prompt. Back from the editor
 *   returns to these ideas.
 * - **Missing items go on the same shopping list** as a recipe's ingredients,
 *   with no recipe attached; the toast offers the list.
 */
export const useFridgeIdeaActions = (query: FridgeIdeasQuery | null): FridgeIdeaActions => {
  const router = useRouter();
  const { shoppingListStore } = useStores();

  const cook = useCallback(
    (idea: FridgeIdea): void => {
      if (query === null) return;
      const { filters } = query;
      const prompt = fridgeIdeaPrompt(
        {
          idea,
          ingredients: query.ingredients,
          maxMinutes: filters.maxMinutes,
          dietLabel: filters.diet === FridgeDiet.None ? null : dietLabel(filters.diet),
          servings: filters.servings,
        },
        fridgePromptWording(),
      );
      router.push(RoutePaths.createRecipeWithPrompt(prompt) as Href);
    },
    [query, router],
  );

  const addMissing = useCallback(
    async (idea: FridgeIdea): Promise<boolean> => {
      const result = await shoppingListStore.getState().addFromRecipe(idea.missing, null);
      if (!result.ok) {
        showErrorToast(result.failure);
        return false;
      }
      const count = result.value.added + result.value.merged;
      showSuccessToast(t().fridge.addedToast.replace('{n}', String(count)), {
        label: t().fridge.viewList,
        onRetry: () => router.push(RoutePaths.shoppingList),
      });
      return true;
    },
    [router, shoppingListStore],
  );

  return { cook, addMissing };
};
