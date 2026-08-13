import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import { RecipeEntity } from '@domain/recipes/recipe-entity';
import type { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';
import type { RecipeRepositoryInterface } from '@domain/recipes/recipe-repository-interface';
import type { CreateRecipeInput } from '@domain/recipes/create/create-recipe-input';
import type { CreateRecipeProgressCallback } from '@domain/recipes/create/create-recipe-progress-callback';
import type { RecipeFilters } from '@domain/recipes/list/recipe-filters';
import type { DraftRecipeSnapshot } from '@domain/drafts/draft-recipe-snapshot';
import type { RefinedRecipe } from '@domain/recipes/refine/refined-recipe';
import type { HttpClient } from '@infrastructure/network/http/http-client';
import type { RecipePage } from '@domain/recipes/list/recipe-page';
import { toRecipeListQuery } from '@infrastructure/recipes/to-recipe-list-query';
import { toRecipePage } from '@infrastructure/recipes/to-recipe-page';
import { FIRST_PAGE, MY_RECIPES_PAGE_SIZE, TRENDING_RECIPES_LIMIT } from '@infrastructure/constants/api/api-paging';
import { AI_REQUEST_TIMEOUT_MS, IMPORT_REQUEST_TIMEOUT_MS } from '@infrastructure/constants/api/api-timeouts';
import { ApiRoutes } from '@infrastructure/constants/api/api-routes';
import type { RecipeDto } from '@infrastructure/recipes/dtos/recipe-dto';
import type { RefineRecipeResponseDto } from '@infrastructure/recipes/refine/refine-recipe-response-dto';
import type { RecipesListDto } from '@infrastructure/recipes/dtos/recipes-list-dto';
import { toRecipe } from '@infrastructure/recipes/recipe-mapper';
import { mapRecipeSummaries } from '@infrastructure/recipes/map-recipe-summaries';
import { buildCreateRecipeFormData } from '@infrastructure/recipes/create/build-create-recipe-form-data';
import type { GenerateRecipeRequestDto } from '@infrastructure/recipes/dtos/generate-recipe-request-dto';
import type { ImportRecipeRequestDto } from '@infrastructure/recipes/dtos/import-recipe-request-dto';
import type { ImportJobDto } from '@infrastructure/recipes/dtos/import-job-dto';
import type { ImportJob } from '@domain/recipes/import/import-job';
import { toImportJob } from '@infrastructure/recipes/import/to-import-job';
import type { RefineRecipeRequestDto } from '@infrastructure/recipes/refine/refine-recipe-request-dto';
import type { ChatMessage } from '@domain/drafts/chat-message';

/**
 * Implements `RecipeRepositoryInterface` against the Recipely backend. Handles
 * listing, fetching, creating, updating, deleting, and AI-generating recipes
 * via HTTP. Image uploads are handled as multipart form-data with
 * platform-specific blob construction for web vs. native.
 */
export class RecipeRepository implements RecipeRepositoryInterface {
  constructor(private readonly http: HttpClient) {}

  async listActiveRecipes(filters?: RecipeFilters): Promise<Result<RecipePage, Failure>> {
    const result = await this.http.get<RecipesListDto>(ApiRoutes.recipes.root, { params: toRecipeListQuery(filters) });
    if (!result.ok) {
      return result;
    }
    return toRecipePage(result.value);
  }

  async listTrendingRecipes(limit?: number): Promise<Result<RecipeSummaryEntity[], Failure>> {
    const result = await this.http.get<RecipesListDto>(ApiRoutes.recipes.trending, { params: { limit: limit ?? TRENDING_RECIPES_LIMIT } });
    if (!result.ok) {
      return result;
    }
    return mapRecipeSummaries(result.value.items);
  }

  async listMyRecipes(page?: number): Promise<Result<RecipePage, Failure>> {
    const result = await this.http.get<RecipesListDto>(ApiRoutes.me.recipes, { params: { page: page ?? FIRST_PAGE, pageSize: MY_RECIPES_PAGE_SIZE } });
    if (!result.ok) {
      return result;
    }
    return toRecipePage(result.value);
  }

  async getRecipe(id: string): Promise<Result<RecipeEntity, Failure>> {
    const result = await this.http.get<RecipeDto>(ApiRoutes.recipes.byId(id));
    if (!result.ok) {
      return result;
    }
    return this.mapRecipe(result.value);
  }

  async createRecipe(
    input: CreateRecipeInput,
    onProgress?: CreateRecipeProgressCallback,
  ): Promise<Result<RecipeEntity, Failure>> {
    const formData = await buildCreateRecipeFormData(input);
    const result = await this.http.uploadMultipart<RecipeDto>(
      ApiRoutes.recipes.withMedia,
      formData,
      onProgress ? (event) => onProgress(event.loaded, event.total) : undefined,
    );
    if (!result.ok) {
      return result;
    }
    return this.mapRecipe(result.value);
  }

  async deleteRecipe(id: string): Promise<Result<void, Failure>> {
    const result = await this.http.delete<unknown>(ApiRoutes.recipes.byId(id));
    if (!result.ok) {
      return result;
    }
    return ok(undefined);
  }

  // WHY: locale is intentionally not in the body — HttpClient already attaches
  // the `Accept-Language` header via its localeProvider, and the backend reads
  // `req.locale` from that header. Keeping it off the wire avoids two sources of
  // truth for the request locale. The per-request `timeout` override is required
  // because the synchronous Gemini call routinely exceeds the client's default
  // 10s JSON timeout, which would abort a request the backend then completes.
  async generateRecipe(prompt: string): Promise<Result<RecipeEntity, Failure>> {
    const result = await this.http.post<RecipeDto>(ApiRoutes.recipes.generate, { prompt } satisfies GenerateRecipeRequestDto, { timeout: AI_REQUEST_TIMEOUT_MS });
    if (!result.ok) {
      return result;
    }
    return this.mapRecipe(result.value);
  }

  // WHY: like generateRecipe, the import returns a NOT-persisted preview Recipe
  // and the locale rides Accept-Language (kept off the body to avoid two sources
  // of truth). The per-request `timeout` override is required because the
  // backend can take up to ~120s (download + transcription + vision) — the
  // client's default 10s JSON timeout would abort the request first. The request
  // interceptor only overrides config.timeout for FormData payloads, so this
  // JSON override is honoured untouched.
  async importInstagramRecipe(url: string): Promise<Result<RecipeEntity, Failure>> {
    const result = await this.http.post<RecipeDto>(ApiRoutes.recipes.import, { url } satisfies ImportRecipeRequestDto, { timeout: IMPORT_REQUEST_TIMEOUT_MS });
    if (!result.ok) {
      return result;
    }
    return this.mapRecipe(result.value);
  }

  async enqueueInstagramImport(url: string): Promise<Result<ImportJob, Failure>> {
    const result = await this.http.post<ImportJobDto>(
      ApiRoutes.recipes.importJobs,
      { url } satisfies ImportRecipeRequestDto,
    );
    if (!result.ok) {
      return result;
    }
    return toImportJob(result.value);
  }

  async getImportJob(id: string): Promise<Result<ImportJob, Failure>> {
    const result = await this.http.get<ImportJobDto>(ApiRoutes.recipes.importJob(id));
    if (!result.ok) {
      return result;
    }
    return toImportJob(result.value);
  }

  // WHY: like generateRecipe, refine returns a NOT-persisted preview recipe —
  // wrapped in a RefinedRecipe read model because the wire response flattens
  // the AI's `summary` / `suggestion` on top of the recipe DTO fields. The
  // locale rides Accept-Language (kept off the body to avoid two sources of
  // truth). The current in-progress recipe is sent as a DraftRecipeSnapshot. The
  // per-request `timeout` override is required for the same reason as generate —
  // the synchronous Gemini call routinely exceeds the default 10s JSON timeout.
  async refineRecipe(
    currentRecipe: DraftRecipeSnapshot,
    instruction: string,
    history: readonly ChatMessage[],
  ): Promise<Result<RefinedRecipe, Failure>> {
    const result = await this.http.post<RefineRecipeResponseDto>(ApiRoutes.recipes.refine, { currentRecipe, instruction, history } satisfies RefineRecipeRequestDto, { timeout: AI_REQUEST_TIMEOUT_MS });
    if (!result.ok) {
      return result;
    }
    const mapped = this.mapRecipe(result.value);
    if (!mapped.ok) {
      return mapped;
    }
    return ok({
      recipe: mapped.value,
      summary: result.value.summary,
      suggestion: result.value.suggestion,
    });
  }

  private mapRecipe(dto: RecipeDto): Result<RecipeEntity, Failure> {
    const mapped = toRecipe(dto);
    if (!mapped.ok) {
      return fail(mapped.failure);
    }
    return ok(mapped.value);
  }
}
