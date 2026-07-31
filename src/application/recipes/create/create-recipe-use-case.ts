import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { RecipeEntity } from '@domain/recipes/recipe-entity';
import type { RecipeRepositoryInterface } from '@domain/recipes/recipe-repository-interface';
import type { CreateRecipeInput } from '@domain/recipes/create/create-recipe-input';
import type { CreateRecipeProgressCallback } from '@domain/recipes/create/create-recipe-progress-callback';

/**
 * Creates a new recipe by uploading a cover image and recipe fields as
 * multipart form-data. An optional progress callback reports upload progress.
 */
export class CreateRecipeUseCase {
  constructor(private readonly repo: RecipeRepositoryInterface) {}

  execute(
    input: CreateRecipeInput,
    onProgress?: CreateRecipeProgressCallback,
  ): Promise<Result<RecipeEntity, Failure>> {
    return this.repo.createRecipe(input, onProgress);
  }
}
