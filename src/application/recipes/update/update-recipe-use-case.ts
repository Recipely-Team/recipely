import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { RecipeEntity } from '@domain/recipes/recipe-entity';
import type { IRecipeRepository } from '@domain/recipes/i-recipe-repository';
import type { UpdateRecipeInput } from '@domain/recipes/update/update-recipe-input';
import type { CreateRecipeProgressCallback } from '@domain/recipes/create/create-recipe-progress-callback';

/**
 * Updates an existing recipe by its `id`. When a new `imageUri` is supplied
 * the image is uploaded separately before patching the recipe fields.
 */
export class UpdateRecipeUseCase {
  constructor(private readonly repo: IRecipeRepository) {}

  execute(
    id: string,
    input: UpdateRecipeInput,
    onProgress?: CreateRecipeProgressCallback,
  ): Promise<Result<RecipeEntity, Failure>> {
    return this.repo.updateRecipe(id, input, onProgress);
  }
}
