import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { RecipeDraft } from '@domain/drafts/recipe-draft';
import type { DraftsListState } from '@application/drafts/list/drafts-list-state';
import type { UpsertDraftStoreInput } from '@application/drafts/write/upsert-draft-store-input';

export interface DraftsStoreState {
  drafts: readonly RecipeDraft[];
  listState: DraftsListState;
  latestDraft: RecipeDraft | null;
  loadDrafts: () => Promise<void>;
  /** Appends the next page. No-op while one is in flight or the list is complete. */
  loadMoreDrafts: () => Promise<void>;
  loadLatestDraft: () => Promise<void>;
  upsertDraft: (input: UpsertDraftStoreInput) => Promise<RecipeDraft | null>;
  deleteDraft: (id: string) => Promise<Result<void, Failure>>;
  getDraft: (id: string) => Promise<RecipeDraft | null>;
  /** Drops the signed-in user's drafts and resume card. Called when the session ends. */
  clear: () => void;
}
