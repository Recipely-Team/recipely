import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { RecipeDraft } from '@domain/drafts/recipe-draft';
import type { PagedList } from '@application/store/paging/paged-list';
import type { UpsertDraftStoreInput } from '@application/drafts/write/upsert-draft-store-input';

export interface DraftsStoreState {
  /** The viewer's drafts, paged on scroll; `Loaded` carries the cursor and the next-page state. */
  drafts: PagedList<RecipeDraft>;
  latestDraft: RecipeDraft | null;
  /**
   * The first page. Only the first load shows a skeleton; a reload keeps the
   * rows on screen and, when it fails, keeps them and returns why.
   */
  loadDrafts: () => Promise<Failure | null>;
  /** Appends the next page. No-op while one is in flight or the list is complete. */
  loadMoreDrafts: () => Promise<void>;
  loadLatestDraft: () => Promise<void>;
  upsertDraft: (input: UpsertDraftStoreInput) => Promise<RecipeDraft | null>;
  deleteDraft: (id: string) => Promise<Result<void, Failure>>;
  /**
   * Reads one draft, and says why when it cannot.
   *
   * Returns the `Result`, not `null`: collapsing every failure to "nothing"
   * left the screen with one sentence — "couldn't open that draft" — for a
   * missing draft, an expired session and a dead connection alike, and left
   * crash reporting with nothing at all.
   */
  getDraft: (id: string) => Promise<Result<RecipeDraft, Failure>>;
  /** Drops the signed-in user's drafts and resume card. Called when the session ends. */
  clear: () => void;
}
