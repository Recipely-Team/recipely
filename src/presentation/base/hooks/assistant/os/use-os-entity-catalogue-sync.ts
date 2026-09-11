import { useEffect } from 'react';
import { ValueConstants } from '@core/constants';
import { StoreStatus } from '@application/store/store-status';
import type { OsRecipeHandle } from '@domain/assistant/os/os-recipe-handle';
import type { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';
import { useStores } from '@presentation/bootstrap/use-stores';

const CATALOGUE_LIMIT = 24;

/**
 * Keeps the names the OS can resolve in step with the user's own recipes.
 *
 * @remarks
 * - **An intent has no session and often no network.** Siri resolves "open the
 *   köfte recipe" against a catalogue on disk and Android resolves it against
 *   dynamic shortcuts, so a recipe the user can name out loud has to have been
 *   written down before the app was asked. This is the writing.
 * - **Saved first, then created.** Both are the user's own, but a saved recipe
 *   is one they chose to come back to — which is what someone is likeliest to
 *   ask for by name — and Android publishes only the first handful as
 *   shortcuts.
 * - **A signed-out user publishes nothing.** The catalogue outlives the session
 *   in the shared container, so leaving it behind would let the next person to
 *   hold the phone read the previous one's recipe titles out of Spotlight.
 */
export const useOsEntityCatalogueSync = (): void => {
  const { osAssistant, savedRecipesStore, createdRecipesStore, authStore } = useStores();
  const savedRecipes = savedRecipesStore((state) => state.savedRecipes);
  const createdRecipes = createdRecipesStore((state) => state.recipes);
  const isSignedIn = authStore((state) => state.state.status === StoreStatus.Authenticated);

  useEffect(() => {
    if (!osAssistant.isAvailable) return;
    const handles = isSignedIn ? toHandles(savedRecipes, createdRecipes) : [];
    void osAssistant.publishRecipes(handles);
  }, [osAssistant, savedRecipes, createdRecipes, isSignedIn]);
};

/**
 * Saved before created, each id once, capped well above the launcher's own
 * limit — Android trims again to the handful of shortcuts it will show, while
 * Spotlight can resolve every name in the catalogue.
 */
const toHandles = (
  saved: readonly RecipeSummaryEntity[],
  created: readonly RecipeSummaryEntity[],
): OsRecipeHandle[] => {
  const seen = new Set<string>();
  const handles: OsRecipeHandle[] = [];

  for (const recipe of [...saved, ...created]) {
    if (handles.length === CATALOGUE_LIMIT) break;
    if (seen.has(recipe.id)) continue;
    seen.add(recipe.id);
    handles.push({
      id: recipe.id,
      title: recipe.name,
      subtitle: recipe.cuisine.length > ValueConstants.zero ? recipe.cuisine : null,
    });
  }

  return handles;
};
