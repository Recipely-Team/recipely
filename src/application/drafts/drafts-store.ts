import type { BoundStore } from '@application/store/bound-store';
import { StoreStatus } from '@application/store/store-status';
import { create } from 'zustand';
import type { DraftsStoreState } from '@application/drafts/drafts-store-state';
import type { RecipeDraft } from '@domain/drafts/recipe-draft';
import { PagedListLoader } from '@application/store/paging/paged-list-loader';

import type { ListDraftsUseCase } from '@application/drafts/list/list-drafts-use-case';
import type { GetLatestDraftUseCase } from '@application/drafts/read/get-latest-draft-use-case';
import type { GetDraftUseCase } from '@application/drafts/read/get-draft-use-case';
import type { UpsertDraftUseCase } from '@application/drafts/write/upsert-draft-use-case';
import type { DeleteDraftUseCase } from '@application/drafts/write/delete-draft-use-case';

interface DraftsStoreDeps {
  listDraftsUseCase: ListDraftsUseCase;
  getLatestDraftUseCase: GetLatestDraftUseCase;
  getDraftUseCase: GetDraftUseCase;
  upsertDraftUseCase: UpsertDraftUseCase;
  deleteDraftUseCase: DeleteDraftUseCase;
}

/**
 * **Drafts store** — the viewer's drafts list and the resume-card pointer.
 *
 * @remarks
 * - **Paged through a `PagedListLoader`**: first page, next page on scroll,
 *   refresh without a skeleton once loaded.
 * - **Session-scoped**: `clear()` resets the loader, so a page that started
 *   under the previous account never publishes — signing out mid-request had
 *   put the previous account's drafts back into the list.
 * - **Edits show without a reload**: a saved draft replaces its row or joins
 *   the top; a deleted one leaves the list and, if it was the latest, the card.
 */
export const configureDraftsStore = (deps: DraftsStoreDeps): BoundStore<DraftsStoreState> =>
  create<DraftsStoreState>((set, get) => {
    const loader = new PagedListLoader<RecipeDraft>(() => get().drafts, (drafts) => set({ drafts }), (draft) => draft.id);
    const fetchPage = (page: number) => deps.listDraftsUseCase.execute(page);

    return {
      drafts: { status: StoreStatus.Idle },
      latestDraft: null,
      loadDrafts: () => loader.refresh(fetchPage),
      loadMoreDrafts: () => loader.loadMore(),
      loadLatestDraft: async () => {
        const result = await deps.getLatestDraftUseCase.execute();
        if (result.ok) set({ latestDraft: result.value });
      },
      upsertDraft: async (input) => {
        const result = await deps.upsertDraftUseCase.execute(input);
        if (!result.ok) return null;
        loader.upsertItem(result.value);
        set({ latestDraft: result.value });
        return result.value;
      },
      deleteDraft: async (id) => {
        const result = await deps.deleteDraftUseCase.execute(id);
        if (!result.ok) return result;
        loader.removeItem(id);
        set((s) => ({ latestDraft: s.latestDraft?.id === id ? null : s.latestDraft }));
        return result;
      },
      getDraft: (id) => deps.getDraftUseCase.execute(id),
      clear: () => {
        loader.reset();
        set({ latestDraft: null });
      },
    };
  });
