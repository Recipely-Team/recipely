import type { Failure } from '@core/failure';
import type { Result } from '@core/result/result';
import type { RecipeDraft } from '@domain/drafts/recipe-draft';
import type { Page } from '@domain/common/page';

export interface FakeRecipeDraftRepositoryConfig {
  listDraftsResult?: Result<Page<RecipeDraft>, Failure>;
  getLatestDraftResult?: Result<RecipeDraft | null, Failure>;
  getDraftResult?: Result<RecipeDraft, Failure>;
  upsertDraftResult?: Result<RecipeDraft, Failure>;
  deleteDraftResult?: Result<void, Failure>;
}
