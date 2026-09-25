import type { BoundStore } from '@application/store/bound-store';
import { StoreStatus } from '@application/store/store-status';
import { create } from 'zustand';
import { ErrorMessageKey, type Failure } from '@core/failure';
import type { Result } from '@core/result/result';
import type { PublishOutcome } from '@domain/recipes/publishing/publish-outcome';
import type { RecipeDetailStoreState } from '@application/recipes/detail/recipe-detail-store-state';
import type { RecipePublishingStoreState } from '@application/recipes/publishing/recipe-publishing-store-state';
import type { PublishRecipeUseCase } from '@application/recipes/publishing/publish-recipe-use-case';
import type { UnpublishRecipeUseCase } from '@application/recipes/publishing/unpublish-recipe-use-case';
import type { EditRecipeUseCase } from '@application/recipes/edit/edit-recipe-use-case';

interface RecipePublishingStoreDeps {
  publishRecipe: PublishRecipeUseCase;
  unpublishRecipe: UnpublishRecipeUseCase;
  editRecipe: EditRecipeUseCase;
  recipeDetailStore: BoundStore<RecipeDetailStoreState>;
}

/**
 * Publishing, unpublishing and editing a recipe the user owns.
 *
 * @remarks
 * - **The detail cache is the one copy.** Every success writes the server's
 *   answer into `recipeDetailStore`, which the owner's status panel renders —
 *   no second copy of the recipe lives here.
 * - **A copyright refusal reloads.** The 409 means the checklist on screen is
 *   out of date; the recipe's own `publishBlockers` are what redraw it.
 */
export const configureRecipePublishingStore = (
  deps: RecipePublishingStoreDeps,
): BoundStore<RecipePublishingStoreState> => {
  const applyOutcome = (recipeId: string, outcome: PublishOutcome): void => {
    const cached = deps.recipeDetailStore.getState().byId[recipeId];
    if (cached?.status !== StoreStatus.Loaded) return;
    deps.recipeDetailStore.getState().put(cached.recipe.withPublishOutcome(outcome));
  };

  return create<RecipePublishingStoreState>((set) => {
    const run = async (
      recipeId: string,
      request: () => Promise<Result<PublishOutcome, Failure>>,
    ): Promise<Failure | null> => {
      set({ isBusy: true });
      const result = await request();
      set({ isBusy: false });
      if (!result.ok) {
        if (result.failure.messageKey === ErrorMessageKey.publishBlockedCopyright) {
          await deps.recipeDetailStore.getState().load(recipeId);
        }
        return result.failure;
      }
      applyOutcome(recipeId, result.value);
      return null;
    };

    return {
      isBusy: false,
      publish: (recipeId) => run(recipeId, () => deps.publishRecipe.execute(recipeId)),
      unpublish: (recipeId) => run(recipeId, () => deps.unpublishRecipe.execute(recipeId)),
      edit: async (recipeId, input) => {
        set({ isBusy: true });
        const result = await deps.editRecipe.execute(recipeId, input);
        set({ isBusy: false });
        if (!result.ok) return result.failure;
        deps.recipeDetailStore.getState().put(result.value);
        return null;
      },
    };
  });
};
