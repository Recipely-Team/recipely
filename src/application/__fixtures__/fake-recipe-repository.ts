import { type Failure, UnknownFailure } from '@core/failure';
import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import type { IRecipeRepository } from '@domain/recipes/i-recipe-repository';
import type { CreateRecipeInput } from '@domain/recipes/create/create-recipe-input';
import type { CreateRecipeProgressCallback } from '@domain/recipes/create/create-recipe-progress-callback';
import type { RecipeFilters } from '@domain/recipes/list/recipe-filters';
import type { UpdateRecipeInput } from '@domain/recipes/update/update-recipe-input';
import type { RecipeEntity } from '@domain/recipes/recipe-entity';
import type { RefinedRecipe } from '@domain/recipes/refine/refined-recipe';
import type { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';
import type { DraftRecipeSnapshot } from '@domain/drafts/draft-recipe-snapshot';
import type { FakeRecipeRepositoryConfig } from '@application/__fixtures__/fake-recipe-repository-config';
import type { GenerateRecipeCall } from '@application/__fixtures__/generate-recipe-call';
import type { ImportInstagramRecipeCall } from '@application/__fixtures__/import-instagram-recipe-call';
import type { RefineRecipeCall } from '@application/__fixtures__/refine-recipe-call';
import { ValueConstants } from '@core/constants';

/**
 * In-memory test double for `IRecipeRepository`. Returns pre-configured
 * `Result` values for each operation. The `generateRecipe` method additionally
 * records call arguments in `lastGenerateCall` and increments `generateCallCount`
 * so tests can assert on invocation details without a spy framework.
 */
export class FakeRecipeRepository implements IRecipeRepository {
  // Public so tests can assert on the last call without a getter ceremony.
  lastGenerateCall: GenerateRecipeCall | null = null;
  generateCallCount = ValueConstants.zero;
  lastImportInstagramCall: ImportInstagramRecipeCall | null = null;
  importInstagramCallCount = ValueConstants.zero;
  lastRefineCall: RefineRecipeCall | null = null;
  refineCallCount = ValueConstants.zero;

  constructor(private readonly config: FakeRecipeRepositoryConfig = {}) {}

  listActiveRecipes(_filters?: RecipeFilters): Promise<Result<RecipeSummaryEntity[], Failure>> {
    return Promise.resolve(
      this.config.listActiveRecipesResult ?? fail(new UnknownFailure('not configured')),
    );
  }

  listTrendingRecipes(_limit?: number): Promise<Result<RecipeSummaryEntity[], Failure>> {
    return Promise.resolve(
      this.config.listTrendingRecipesResult ?? fail(new UnknownFailure('not configured')),
    );
  }

  listMyRecipes(): Promise<Result<RecipeSummaryEntity[], Failure>> {
    return Promise.resolve(
      this.config.listMyRecipesResult ?? fail(new UnknownFailure('not configured')),
    );
  }

  getRecipe(_id: string): Promise<Result<RecipeEntity, Failure>> {
    return Promise.resolve(
      this.config.getRecipeResult ?? fail(new UnknownFailure('not configured')),
    );
  }

  createRecipe(
    _input: CreateRecipeInput,
    _onProgress?: CreateRecipeProgressCallback,
  ): Promise<Result<RecipeEntity, Failure>> {
    return Promise.resolve(
      this.config.createRecipeResult ?? fail(new UnknownFailure('not configured')),
    );
  }

  generateRecipe(prompt: string): Promise<Result<RecipeEntity, Failure>> {
    this.lastGenerateCall = { prompt };
    this.generateCallCount += 1;
    return Promise.resolve(
      this.config.generateRecipeResult ?? ok(undefined as unknown as RecipeEntity),
    );
  }

  importInstagramRecipe(url: string): Promise<Result<RecipeEntity, Failure>> {
    this.lastImportInstagramCall = { url };
    this.importInstagramCallCount += 1;
    return Promise.resolve(
      this.config.importInstagramRecipeResult ?? ok(undefined as unknown as RecipeEntity),
    );
  }

  refineRecipe(
    currentRecipe: DraftRecipeSnapshot,
    instruction: string,
  ): Promise<Result<RefinedRecipe, Failure>> {
    this.lastRefineCall = { currentRecipe, instruction };
    this.refineCallCount += 1;
    return Promise.resolve(
      this.config.refineRecipeResult ?? ok(undefined as unknown as RefinedRecipe),
    );
  }

  updateRecipe(
    _id: string,
    _input: UpdateRecipeInput,
    _onProgress?: CreateRecipeProgressCallback,
  ): Promise<Result<RecipeEntity, Failure>> {
    return Promise.resolve(
      this.config.updateRecipeResult ?? fail(new UnknownFailure('not configured')),
    );
  }

  deleteRecipe(_id: string): Promise<Result<void, Failure>> {
    return Promise.resolve(
      this.config.deleteRecipeResult ?? ok(undefined as void),
    );
  }
}
