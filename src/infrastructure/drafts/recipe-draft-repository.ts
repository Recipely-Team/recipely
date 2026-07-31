import { ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import { type Failure, NotFoundFailure } from '@core/failure';
import type { RecipeDraft } from '@domain/drafts/recipe-draft';
import type { RecipeDraftRepositoryInterface } from '@domain/drafts/recipe-draft-repository-interface';
import type { PagedDrafts } from '@domain/drafts/paged-drafts';
import type { UpsertDraftInput } from '@domain/drafts/upsert-draft-input';
import type { HttpClient } from '@infrastructure/network/http/http-client';
import { DRAFTS_PAGE_SIZE } from '@infrastructure/constants/api';
import { ApiRoutes } from '@infrastructure/constants/api-routes';
import type { RecipeDraftDto } from '@infrastructure/drafts/dtos/recipe-draft-dto';
import type { DraftsListDto } from '@infrastructure/drafts/dtos/drafts-list-dto';
import { toRecipeDraft } from '@infrastructure/drafts/recipe-draft-mapper';
import { toUpsertDraftRequest } from '@infrastructure/drafts/to-upsert-draft-request';

/**
 * Implements `RecipeDraftRepositoryInterface` against the Recipely backend draft
 * endpoints (mounted under `/recipes`). All bodies are sent as JSON; the
 * locale rides the `Accept-Language` header attached by `HttpClient`.
 */
export class RecipeDraftRepository implements RecipeDraftRepositoryInterface {
  constructor(private readonly http: HttpClient) {}

  async listDrafts(
    page: number,
    pageSize: number = DRAFTS_PAGE_SIZE,
  ): Promise<Result<PagedDrafts, Failure>> {
    const result = await this.http.get<DraftsListDto>(ApiRoutes.recipes.drafts, { params: { page, pageSize } });
    if (!result.ok) {
      return result;
    }
    const { items, total, page: resPage, pageSize: resPageSize } = result.value;
    return ok({
      items: items.map(toRecipeDraft),
      total,
      page: resPage,
      pageSize: resPageSize,
    });
  }

  /**
   * Fetches the most recent draft. A backend 404 (the user has no drafts) is
   * mapped to `ok(null)` so callers never treat "no draft" as an error.
   */
  async getLatestDraft(): Promise<Result<RecipeDraft | null, Failure>> {
    const result = await this.http.get<RecipeDraftDto>(ApiRoutes.recipes.draftsLatest);
    if (!result.ok) {
      if (result.failure instanceof NotFoundFailure) {
        return ok(null);
      }
      return result;
    }
    return ok(toRecipeDraft(result.value));
  }

  async getDraft(id: string): Promise<Result<RecipeDraft, Failure>> {
    const result = await this.http.get<RecipeDraftDto>(ApiRoutes.recipes.draft(id));
    if (!result.ok) {
      return result;
    }
    return ok(toRecipeDraft(result.value));
  }

  async upsertDraft(input: UpsertDraftInput): Promise<Result<RecipeDraft, Failure>> {
    const result = await this.http.put<RecipeDraftDto>(ApiRoutes.recipes.draft(input.id), toUpsertDraftRequest(input));
    if (!result.ok) {
      return result;
    }
    return ok(toRecipeDraft(result.value));
  }

  async deleteDraft(id: string): Promise<Result<void, Failure>> {
    const result = await this.http.delete<unknown>(ApiRoutes.recipes.draft(id));
    if (!result.ok) {
      return result;
    }
    return ok(undefined);
  }
}
