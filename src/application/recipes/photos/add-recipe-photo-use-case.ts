import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { MediaItem } from '@domain/recipes/media/media-item';
import type { RecipeRepositoryInterface } from '@domain/recipes/recipe-repository-interface';

/**
 * Adds one photo to a recipe the signed-in user owns.
 *
 * @remarks
 * - **Ownership is the server's to decide**, not this app's. The screen only
 *   offers the control to the owner, but a screen is a courtesy — the request
 *   is refused on the other side either way.
 * - **The photo is judged before it is stored**, so this can fail with a
 *   refusal about the picture rather than about the request. The screen tells
 *   those apart by the failure's key.
 */
export class AddRecipePhotoUseCase {
  constructor(private readonly repo: RecipeRepositoryInterface) {}

  execute(
    recipeId: string,
    fileUri: string,
    fileName: string,
    mimeType: string,
  ): Promise<Result<MediaItem, Failure>> {
    return this.repo.addRecipePhoto(recipeId, fileUri, fileName, mimeType);
  }
}
