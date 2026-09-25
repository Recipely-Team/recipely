import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { EditRecipeInput } from '@domain/recipes/edit/edit-recipe-input';
import type { RecipeEntity } from '@domain/recipes/recipe-entity';
import type { RecipeRepositoryInterface } from '@domain/recipes/recipe-repository-interface';

/**
 * Saves changes to a private recipe the signed-in user owns.
 *
 * A published recipe is refused (`edit_published`): what other people already
 * read does not change under them, so it is taken back to private first.
 */
export class EditRecipeUseCase {
  constructor(private readonly repo: RecipeRepositoryInterface) {}

  execute(id: string, input: EditRecipeInput): Promise<Result<RecipeEntity, Failure>> {
    return this.repo.updateRecipe(id, input);
  }
}
