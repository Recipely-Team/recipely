import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { RecipeEntity } from '@domain/recipes/recipe-entity';
import type { ImportJob } from '@domain/recipes/import/import-job';
import type { RefinedRecipe } from '@domain/recipes/refine/refined-recipe';
import type { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';
import type { DraftRecipeSnapshot } from '@domain/drafts/draft-recipe-snapshot';
import type { RecipeFilters } from '@domain/recipes/list/recipe-filters';
import type { CreateRecipeInput } from '@domain/recipes/create/create-recipe-input';
import type { CreateRecipeProgressCallback } from '@domain/recipes/create/create-recipe-progress-callback';
import type { RecipePage } from '@domain/recipes/list/recipe-page';

export interface RecipeRepositoryInterface {
  listActiveRecipes(filters?: RecipeFilters): Promise<Result<RecipePage, Failure>>;
  /** Trending recipes for the discover rail, backed by `GET /recipes/trending`. */
  listTrendingRecipes(limit?: number): Promise<Result<RecipeSummaryEntity[], Failure>>;
  listMyRecipes(page?: number): Promise<Result<RecipePage, Failure>>;
  getRecipe(id: string): Promise<Result<RecipeEntity, Failure>>;
  createRecipe(
    input: CreateRecipeInput,
    onProgress?: CreateRecipeProgressCallback,
  ): Promise<Result<RecipeEntity, Failure>>;
  generateRecipe(prompt: string): Promise<Result<RecipeEntity, Failure>>;
  /**
   * Imports an Instagram reel/video into a full preview `Recipe`. The result is
   * NOT persisted (same contract as `generateRecipe` — throwaway id,
   * `isPublished: false`, empty image); the client decides whether to publish
   * it via `createRecipe`. The locale rides the `Accept-Language` header.
   *
   * This call can be slow (the backend runs download + transcription + vision,
   * up to ~120s), so the implementation uses an extended request timeout.
   */
  importInstagramRecipe(url: string): Promise<Result<RecipeEntity, Failure>>;

  /**
   * Queues an Instagram import and returns immediately with a receipt.
   *
   * The synchronous {@link importInstagramRecipe} holds a request open for the
   * 59-128 s the pipeline takes, which a backgrounded app loses outright. This
   * hands the work to a worker instead; the user is told by notification.
   */
  enqueueInstagramImport(url: string): Promise<Result<ImportJob, Failure>>;

  /**
   * Reads a queued import back.
   *
   * A push is not a delivery guarantee — notifications can be off, the token
   * stale, the phone offline — so a screen that is open needs a way to see the
   * result without one.
   */
  getImportJob(id: string): Promise<Result<ImportJob, Failure>>;
  /**
   * Refines an in-progress recipe against a free-text instruction and returns a
   * `RefinedRecipe` read model: the full preview `Recipe` plus the AI's
   * natural-language `summary` / `suggestion`. The recipe is NOT persisted
   * (same contract as `generateRecipe`); the locale rides the
   * `Accept-Language` header.
   */
  refineRecipe(
    currentRecipe: DraftRecipeSnapshot,
    instruction: string,
  ): Promise<Result<RefinedRecipe, Failure>>;
  deleteRecipe(id: string): Promise<Result<void, Failure>>;
}
