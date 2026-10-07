import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import { ok } from '@core/result/result-helpers';
import type { MediaItem } from '@domain/recipes/media/media-item';
import type { RecipeEntity } from '@domain/recipes/recipe-entity';
import type { RemoveRecipePhotoUseCase } from '@application/recipes/photos/remove-recipe-photo-use-case';
import type { RemoveRecipeCoverUseCase } from '@application/recipes/photos/remove-recipe-cover-use-case';

/**
 * **Remove one media item** from a recipe the signed-in user owns, whichever kind it is.
 *
 * @remarks
 * - **Cover:** goes through the cover request (a cover may have no gallery row) and answers
 *   the recipe with the next photo as cover, so the caller can show it before reloading.
 * - **Photo:** goes through the gallery request and answers `null` — the caller reloads.
 * - **Device-only:** an item with no row was never on the server; nothing is asked, `null`.
 */
export class RemoveRecipeMediaUseCase {
  constructor(
    private readonly removeRecipePhoto: RemoveRecipePhotoUseCase,
    private readonly removeRecipeCover: RemoveRecipeCoverUseCase,
  ) {}

  async execute(
    recipeId: string,
    recipe: RecipeEntity | null,
    item: MediaItem,
  ): Promise<Result<RecipeEntity | null, Failure>> {
    if (recipe !== null && recipe.isCover(item)) {
      const removal = await this.removeRecipeCover.execute(recipeId);
      return removal.ok ? ok(recipe.withCoverRemoved(removal.value)) : removal;
    }
    if (item.id === undefined) return ok(null);
    const result = await this.removeRecipePhoto.execute(recipeId, item.id);
    return result.ok ? ok(null) : result;
  }
}
