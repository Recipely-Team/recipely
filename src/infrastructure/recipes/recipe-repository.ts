import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import { RecipeEntity } from '@domain/recipes/recipe-entity';
import type { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';
import type { IRecipeRepository } from '@domain/recipes/i-recipe-repository';
import type { CreateRecipeInput } from '@domain/recipes/create/create-recipe-input';
import type { CreateRecipeProgressCallback } from '@domain/recipes/create/create-recipe-progress-callback';
import type { RecipeFilters } from '@domain/recipes/list/recipe-filters';
import type { UpdateRecipeInput } from '@domain/recipes/update/update-recipe-input';
import type { DraftRecipeSnapshot } from '@domain/drafts/draft-recipe-snapshot';
import type { RefinedRecipe } from '@domain/recipes/refine/refined-recipe';
import type { HttpClient } from '@infrastructure/network/http/http-client';
import {
  AI_REQUEST_TIMEOUT_MS,
  IMPORT_REQUEST_TIMEOUT_MS,
  RECIPES_PAGE_SIZE,
  TRENDING_RECIPES_LIMIT,
} from '@infrastructure/constants/api';
import { ApiRoutes } from '@infrastructure/constants/api-routes';
import type { RecipeDto } from '@infrastructure/recipes/dtos/recipe-dto';
import type { RefineRecipeResponseDto } from '@infrastructure/recipes/refine/refine-recipe-response-dto';
import type { RecipesListDto } from '@infrastructure/recipes/dtos/recipes-list-dto';
import { toRecipe } from '@infrastructure/recipes/recipe-mapper';
import { mapRecipeSummaries } from '@infrastructure/recipes/map-recipe-summaries';
import { buildCreateRecipeFormData } from '@infrastructure/recipes/create/build-create-recipe-form-data';
import { buildUpdateRecipeBody } from '@infrastructure/recipes/update/build-update-recipe-body';
import { uploadRecipeMedia } from '@infrastructure/recipes/media/upload-recipe-media';

/**
 * Implements `IRecipeRepository` against the Recipely backend. Handles
 * listing, fetching, creating, updating, deleting, and AI-generating recipes
 * via HTTP. Image uploads are handled as multipart form-data with
 * platform-specific blob construction for web vs. native.
 */
export class RecipeRepository implements IRecipeRepository {
  constructor(private readonly http: HttpClient) {}

  async listActiveRecipes(filters?: RecipeFilters): Promise<Result<RecipeSummaryEntity[], Failure>> {
    const params: Record<string, unknown> = { page: 1, pageSize: RECIPES_PAGE_SIZE };
    if (filters?.search) params['search'] = filters.search;
    if (filters?.cuisines?.length) params['cuisines'] = filters.cuisines.join(',');
    if (filters?.categories?.length) params['categories'] = filters.categories.join(',');
    if (filters?.difficulties?.length) params['difficulties'] = filters.difficulties.join(',');
    if (filters?.maxTime) params['maxTime'] = filters.maxTime;
    if (filters?.sort) params['sort'] = filters.sort;
    if (filters?.sortOrder) params['sortOrder'] = filters.sortOrder;

    const result = await this.http.request<RecipesListDto>({
      method: 'GET',
      url: ApiRoutes.recipes.root,
      params,
    });
    if (!result.ok) {
      return result;
    }
    return mapRecipeSummaries(result.value.items);
  }

  async listTrendingRecipes(limit?: number): Promise<Result<RecipeSummaryEntity[], Failure>> {
    const result = await this.http.request<RecipesListDto>({
      method: 'GET',
      url: ApiRoutes.recipes.trending,
      params: { limit: limit ?? TRENDING_RECIPES_LIMIT },
    });
    if (!result.ok) {
      return result;
    }
    return mapRecipeSummaries(result.value.items);
  }

  async listMyRecipes(): Promise<Result<RecipeSummaryEntity[], Failure>> {
    const result = await this.http.request<RecipesListDto>({
      method: 'GET',
      url: ApiRoutes.me.recipes,
      params: { page: 1, pageSize: 20 },
    });
    if (!result.ok) {
      return result;
    }
    return mapRecipeSummaries(result.value.items);
  }

  async getRecipe(id: string): Promise<Result<RecipeEntity, Failure>> {
    const result = await this.http.request<RecipeDto>({
      method: 'GET',
      url: ApiRoutes.recipes.byId(id),
    });
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

  async updateRecipe(
    id: string,
    input: UpdateRecipeInput,
    onProgress?: CreateRecipeProgressCallback,
  ): Promise<Result<RecipeEntity, Failure>> {
    const body = buildUpdateRecipeBody(input);

    // WHY: the backend PATCH /:id accepts a full `media[]` of { type, url } and
    // replaces the gallery. Local URIs must first be turned into hosted URLs via
    // POST /upload; already-hosted https URLs are sent verbatim. The first image
    // is also mirrored to `image` to keep the cover in sync.
    if (input.media !== undefined) {
      const galleryResult = await uploadRecipeMedia(this.http, input.media, onProgress);
      if (!galleryResult.ok) return galleryResult;
      const gallery = galleryResult.value;
      body['media'] = gallery;
      const cover = gallery.find((m) => m.type === 'image');
      if (cover !== undefined) body['image'] = cover.url;
    }

    const result = await this.http.request<RecipeDto>({
      method: 'PATCH',
      url: ApiRoutes.recipes.byId(id),
      data: body,
    });
    if (!result.ok) {
      return result;
    }
    return this.mapRecipe(result.value);
  }

  async deleteRecipe(id: string): Promise<Result<void, Failure>> {
    const result = await this.http.request<unknown>({
      method: 'DELETE',
      url: ApiRoutes.recipes.byId(id),
    });
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
    const result = await this.http.request<RecipeDto>({
      method: 'POST',
      url: ApiRoutes.recipes.generate,
      data: { prompt },
      timeout: AI_REQUEST_TIMEOUT_MS,
    });
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
    const result = await this.http.request<RecipeDto>({
      method: 'POST',
      url: ApiRoutes.recipes.import,
      data: { url },
      timeout: IMPORT_REQUEST_TIMEOUT_MS,
    });
    if (!result.ok) {
      return result;
    }
    return this.mapRecipe(result.value);
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
  ): Promise<Result<RefinedRecipe, Failure>> {
    const result = await this.http.request<RefineRecipeResponseDto>({
      method: 'POST',
      url: ApiRoutes.recipes.refine,
      data: { currentRecipe, instruction },
      timeout: AI_REQUEST_TIMEOUT_MS,
    });
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
