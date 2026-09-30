import { useCallback, useState } from 'react';
import { StoreStatus } from '@application/store/store-status';
import type { LoggableFood } from '@domain/diary/entry/loggable-food';
import { useStores } from '@presentation/bootstrap/use-stores';
import { showErrorToast, showWarningToast } from '@presentation/base/feedback/show-toast';
import type { RecipeFoodLoader } from '@presentation/base/widgets/diary/add-food/search/recipe-food-loader';
import { t } from '@presentation/i18n';

/**
 * Resolves a recipe row of the Add food sheet into one loggable serving.
 *
 * @remarks
 * - **Why a fetch.** List rows are summaries and carry no nutrition, so the
 *   full recipe is read through the recipe-detail cache — the same entry the
 *   detail page would use, so opening it later costs nothing.
 * - **"Can it be logged?" is the use case's answer**, never a check here: a
 *   recipe without calories is refused by `buildLoggableFoodFromRecipe` and
 *   the user is told why.
 */
export const useRecipeFoodLoader = (): RecipeFoodLoader => {
  const { recipeDetailStore, buildLoggableFoodFromRecipe } = useStores();
  const cached = recipeDetailStore((s) => s.byId);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const caloriesFor = useCallback(
    (recipeId: string): number | null => {
      const entry = cached[recipeId];
      if (entry?.status !== StoreStatus.Loaded) return null;
      const food = buildLoggableFoodFromRecipe.execute(entry.recipe);
      return food.ok ? food.value.perServing.calories : null;
    },
    [buildLoggableFoodFromRecipe, cached],
  );

  const open = useCallback(
    async (recipeId: string): Promise<LoggableFood | null> => {
      setLoadingId(recipeId);
      await recipeDetailStore.getState().load(recipeId);
      setLoadingId(null);
      const entry = recipeDetailStore.getState().byId[recipeId];
      if (entry?.status === StoreStatus.Error) {
        showErrorToast(entry.failure);
        return null;
      }
      if (entry?.status !== StoreStatus.Loaded) return null;
      const food = buildLoggableFoodFromRecipe.execute(entry.recipe);
      if (food.ok) return food.value;
      showWarningToast(t().diary.recipeNoCalories);
      return null;
    },
    [buildLoggableFoodFromRecipe, recipeDetailStore],
  );

  return { loadingId, caloriesFor, open };
};
