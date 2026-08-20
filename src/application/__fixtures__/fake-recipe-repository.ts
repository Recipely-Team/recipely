import type { FakeRecipeRepositoryConfig } from "@application/__fixtures__/fake-recipe-repository-config";
import type { GenerateRecipeCall } from "@application/__fixtures__/generate-recipe-call";
import type { ImportInstagramRecipeCall } from "@application/__fixtures__/import-instagram-recipe-call";
import type { RefineRecipeCall } from "@application/__fixtures__/refine-recipe-call";
import { ValueConstants } from "@core/constants";
import { type Failure, UnknownFailure } from "@core/failure";
import type { Result } from "@core/result/result";
import { fail, ok } from "@core/result/result-helpers";
import type { ChatMessage } from "@domain/drafts/chat-message";
import type { DraftRecipeSnapshot } from "@domain/drafts/draft-recipe-snapshot";
import type { CreateRecipeInput } from "@domain/recipes/create/create-recipe-input";
import type { CreateRecipeProgressCallback } from "@domain/recipes/create/create-recipe-progress-callback";
import type { ImportJob } from "@domain/recipes/import/import-job";
import type { RecipeFilters } from "@domain/recipes/list/recipe-filters";
import type { RecipePage } from "@domain/recipes/list/recipe-page";
import type { RecipeEntity } from "@domain/recipes/recipe-entity";
import type { RecipeRepositoryInterface } from "@domain/recipes/recipe-repository-interface";
import type { RecipeSummaryEntity } from "@domain/recipes/recipe-summary-entity";
import type { RefinedRecipe } from "@domain/recipes/refine/refined-recipe";

/**
 * In-memory test double for `RecipeRepositoryInterface`. Returns pre-configured
 * `Result` values for each operation. The `generateRecipe` method additionally
 * records call arguments in `lastGenerateCall` and increments `generateCallCount`
 * so tests can assert on invocation details without a spy framework.
 */
export class FakeRecipeRepository implements RecipeRepositoryInterface {
  // Public so tests can assert on the last call without a getter ceremony.
  lastGenerateCall: GenerateRecipeCall | null = null;
  generateCallCount = ValueConstants.zero;
  lastImportInstagramCall: ImportInstagramRecipeCall | null = null;
  importInstagramCallCount = ValueConstants.zero;
  lastRefineCall: RefineRecipeCall | null = null;
  refineCallCount = ValueConstants.zero;

  constructor(private readonly config: FakeRecipeRepositoryConfig = {}) {}

  listActiveRecipes(
    _filters?: RecipeFilters,
  ): Promise<Result<RecipePage, Failure>> {
    return Promise.resolve(
      this.config.listActiveRecipesResult ??
        fail(new UnknownFailure("not configured")),
    );
  }

  listTrendingRecipes(
    _limit?: number,
  ): Promise<Result<RecipeSummaryEntity[], Failure>> {
    return Promise.resolve(
      this.config.listTrendingRecipesResult ??
        fail(new UnknownFailure("not configured")),
    );
  }

  listMyRecipes(_page?: number): Promise<Result<RecipePage, Failure>> {
    return Promise.resolve(
      this.config.listMyRecipesResult ??
        fail(new UnknownFailure("not configured")),
    );
  }

  getRecipe(_id: string): Promise<Result<RecipeEntity, Failure>> {
    return Promise.resolve(
      this.config.getRecipeResult ?? fail(new UnknownFailure("not configured")),
    );
  }

  createRecipe(
    _input: CreateRecipeInput,
    _onProgress?: CreateRecipeProgressCallback,
  ): Promise<Result<RecipeEntity, Failure>> {
    return Promise.resolve(
      this.config.createRecipeResult ??
        fail(new UnknownFailure("not configured")),
    );
  }

  generateRecipe(prompt: string): Promise<Result<RecipeEntity, Failure>> {
    this.lastGenerateCall = { prompt };
    this.generateCallCount++;
    return Promise.resolve(
      this.config.generateRecipeResult ??
        ok(undefined as unknown as RecipeEntity),
    );
  }

  importInstagramRecipe(url: string): Promise<Result<RecipeEntity, Failure>> {
    this.lastImportInstagramCall = { url };
    this.importInstagramCallCount++;
    return Promise.resolve(
      this.config.importInstagramRecipeResult ??
        ok(undefined as unknown as RecipeEntity),
    );
  }

  /** Records the URL so a test can assert the queue was asked, not the pipeline. */
  lastEnqueueImportCall: { url: string } | null = null;

  enqueueInstagramImport(url: string): Promise<Result<ImportJob, Failure>> {
    this.lastEnqueueImportCall = { url };
    return Promise.resolve(
      this.config.enqueueInstagramImportResult ??
        ok(undefined as unknown as ImportJob),
    );
  }

  getImportJob(id: string): Promise<Result<ImportJob, Failure>> {
    return Promise.resolve(
      this.config.getImportJobResult ??
        ok({
          id,
          status: "queued",
          draftId: null,
          errorKey: null,
        } as ImportJob),
    );
  }

  refineRecipe(
    currentRecipe: DraftRecipeSnapshot,
    instruction: string,
    history: readonly ChatMessage[],
  ): Promise<Result<RefinedRecipe, Failure>> {
    this.lastRefineCall = { currentRecipe, instruction, history };
    this.refineCallCount++;
    return Promise.resolve(
      this.config.refineRecipeResult ??
        ok(undefined as unknown as RefinedRecipe),
    );
  }

  deleteRecipe(_id: string): Promise<Result<void, Failure>> {
    return Promise.resolve(
      this.config.deleteRecipeResult ?? ok(undefined as void),
    );
  }
}
