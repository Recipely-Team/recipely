import { CreateRecipeUseCase } from '@application/recipes/create/create-recipe-use-case';
import { recipeEntityOf } from '@application/__fixtures__/recipe-entity-of';
import { UnknownFailure } from '@core/failure';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import { ok } from '@core/result/result-helpers';
import type { CreateRecipeInput } from '@domain/recipes/create/create-recipe-input';
import type { RecipeRepositoryInterface } from '@domain/recipes/recipe-repository-interface';

/** A throw from the upload used to leave the publish button busy; the use case answers a Result. */

const input = {} as CreateRecipeInput;
const repoWith = (createRecipe: () => Promise<unknown>) =>
  ({ createRecipe }) as unknown as RecipeRepositoryInterface;

describe('CreateRecipeUseCase', () => {
  it('passes the created recipe through', async () => {
    const recipe = recipeEntityOf({ id: 'r1' });
    const result = await new CreateRecipeUseCase(repoWith(async () => ok(recipe))).execute(input);

    expect(result).toEqual(ok(recipe));
  });

  it('turns a throwing upload into an UnknownFailure instead of rejecting', async () => {
    const result = await new CreateRecipeUseCase(
      repoWith(async () => {
        throw new Error('socket closed');
      }),
    ).execute(input);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.failure).toBeInstanceOf(UnknownFailure);
    expect(result.failure.message).toBe(DiagnosticMessage.recipeCreate.threw);
  });
});
