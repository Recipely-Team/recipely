import type { Result } from '@core/result/result';
import { UnknownFailure, type Failure } from '@core/failure';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import { fail } from '@core/result/result-helpers';
import type { RecipeEntity } from '@domain/recipes/recipe-entity';
import type { RecipeRepositoryInterface } from '@domain/recipes/recipe-repository-interface';
import type { CreateRecipeInput } from '@domain/recipes/create/create-recipe-input';
import type { CreateRecipeProgressCallback } from '@domain/recipes/create/create-recipe-progress-callback';

/**
 * Creates a new recipe by uploading a cover image and recipe fields as
 * multipart form-data. An optional progress callback reports upload progress.
 *
 * @remarks
 * - **Never rejects:** a throw from the upload becomes an `UnknownFailure`, or the
 *   publish button would stay busy forever (rule 12: callers get a `Result`, not a catch).
 */
export class CreateRecipeUseCase {
  constructor(private readonly repo: RecipeRepositoryInterface) {}

  async execute(
    input: CreateRecipeInput,
    onProgress?: CreateRecipeProgressCallback,
  ): Promise<Result<RecipeEntity, Failure>> {
    try {
      return await this.repo.createRecipe(input, onProgress);
    } catch (error) {
      return fail(new UnknownFailure(DiagnosticMessage.recipeCreate.threw, error));
    }
  }
}
