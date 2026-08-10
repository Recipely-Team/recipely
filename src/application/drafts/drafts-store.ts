import type { BoundStore } from '@application/store/bound-store';
import { StoreStatus } from '@application/store/store-status';
import { create } from 'zustand';
import type { DraftsStoreState } from '@application/drafts/drafts-store-state';
import { DRAFTS_PAGE_SIZE, FIRST_PAGE } from '@infrastructure/constants/api/api-paging';
import { ValueConstants } from '@core/constants';

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

export const configureDraftsStore = (deps: DraftsStoreDeps): BoundStore<DraftsStoreState> => {
  /**
   * Bumped by `clear()`. A page that started under an earlier session must not
   * publish its answer — signing out mid-request put the previous account's
   * drafts back into the list.
   */
  let session = ValueConstants.zero;

  return create<DraftsStoreState>((set, get) => ({
    drafts: [],
    listState: { status: StoreStatus.Idle },
    latestDraft: null,
    loadDrafts: async () => {
      const requested = session;
      // Only the FIRST load announces itself: a reload of a list that is
      // already on screen keeps its `Loaded` state, or every re-focus — and
      // every pull-to-refresh — would swap the rows for a skeleton.
      if (get().listState.status !== StoreStatus.Loaded) {
        set({ listState: { status: StoreStatus.Loading } });
      }
      const result = await deps.listDraftsUseCase.execute({
        page: FIRST_PAGE,
        pageSize: DRAFTS_PAGE_SIZE,
      });
      if (requested !== session) return;
      if (!result.ok) {
        set({ listState: { status: StoreStatus.Error, failure: result.failure } });
        return;
      }
      const { items, total, page } = result.value;
      set({
        drafts: items,
        listState: {
          status: StoreStatus.Loaded,
          page,
          hasMore: items.length < total,
        },
      });
    },
    loadMoreDrafts: async () => {
      const current = get().listState;
      if (
        current.status !== StoreStatus.Loaded ||
        !current.hasMore ||
        current.isLoadingMore === true
      ) {
        return;
      }
      set({ listState: { ...current, isLoadingMore: true } });
      const result = await deps.listDraftsUseCase.execute({
        page: current.page + ValueConstants.one,
        pageSize: DRAFTS_PAGE_SIZE,
      });
      if (!result.ok) {
        // The rows already on screen stay; only the append failed.
        set({ listState: { ...current, isLoadingMore: false } });
        return;
      }
      const { items, total, page } = result.value;
      const merged = [...get().drafts, ...items];
      set({
        drafts: merged,
        listState: {
          status: StoreStatus.Loaded,
          page,
          hasMore: merged.length < total,
        },
      });
    },
    loadLatestDraft: async () => {
      const result = await deps.getLatestDraftUseCase.execute();
      if (!result.ok) {
        return;
      }
      set({ latestDraft: result.value });
    },
    upsertDraft: async (input) => {
      const result = await deps.upsertDraftUseCase.execute(input);
      if (!result.ok) {
        return null;
      }
      const draft = result.value;
      // WHY: keep the local list and the "latest" pointer in sync so the AI
      // create flow reflects the just-saved draft without a full reload.
      set((s) => {
        const exists = s.drafts.some((d) => d.id === draft.id);
        const drafts = exists
          ? s.drafts.map((d) => (d.id === draft.id ? draft : d))
          : [draft, ...s.drafts];
        return { drafts, latestDraft: draft };
      });
      return draft;
    },
    deleteDraft: async (id) => {
      const result = await deps.deleteDraftUseCase.execute(id);
      if (!result.ok) {
        return result;
      }
      set((s) => ({
        drafts: s.drafts.filter((d) => d.id !== id),
        latestDraft: s.latestDraft?.id === id ? null : s.latestDraft,
      }));
      return result;
    },
    getDraft: (id) => deps.getDraftUseCase.execute(id),
    clear: () => {
      session += ValueConstants.one;
      set({ drafts: [], listState: { status: StoreStatus.Idle }, latestDraft: null });
    },
  }));
};
