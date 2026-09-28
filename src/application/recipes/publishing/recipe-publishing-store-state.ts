import type { Failure } from '@core/failure';
import type { EditRecipeInput } from '@domain/recipes/edit/edit-recipe-input';

/**
 * The owner's actions on a saved recipe: publish, take back, edit.
 *
 * Each returns the failure (or null) so the screen can say which kind it was;
 * the recipe itself is read from the detail store, which every success updates.
 */
export interface RecipePublishingStoreState {
  /** True while one of the three requests is in flight. */
  isBusy: boolean;
  publish: (recipeId: string) => Promise<Failure | null>;
  unpublish: (recipeId: string) => Promise<Failure | null>;
  edit: (recipeId: string, input: EditRecipeInput) => Promise<Failure | null>;
}
