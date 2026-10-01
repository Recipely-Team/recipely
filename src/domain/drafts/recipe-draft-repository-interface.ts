import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { RecipeDraft } from '@domain/drafts/recipe-draft';
import type { UpsertDraftInput } from '@domain/drafts/upsert-draft-input';
import type { Page } from '@domain/common/page';

export interface RecipeDraftRepositoryInterface {
  listDrafts(page: number, pageSize: number): Promise<Result<Page<RecipeDraft>, Failure>>;
  /**
   * Returns the user's most recently updated draft, or `ok(null)` when they
   * have none. A backend 404 is treated as "no draft", not an error.
   */
  getLatestDraft(): Promise<Result<RecipeDraft | null, Failure>>;
  getDraft(id: string): Promise<Result<RecipeDraft, Failure>>;
  upsertDraft(input: UpsertDraftInput): Promise<Result<RecipeDraft, Failure>>;
  deleteDraft(id: string): Promise<Result<void, Failure>>;
}
