import type { BoundStore } from '@application/store/bound-store';
import { StoreStatus } from '@application/store/store-status';
import { create } from 'zustand';
import type { DraftsStoreState } from '@application/drafts/drafts-store-state';
import { DRAFTS_PAGE_SIZE } from '@infrastructure/constants/api';

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
  return create<DraftsStoreState>((set, get) => ({
    drafts: [],
    listState: { status: StoreStatus.Idle },
    latestDraft: null,
    loadDrafts: async () => {
      set({ listState: { status: StoreStatus.Loading } });
      const result = await deps.listDraftsUseCase.execute({
        page: 1, // TO DO: page backendden gelmeli
        pageSize: DRAFTS_PAGE_SIZE,
      });
      if (!result.ok) {
        set({ listState: { status: StoreStatus.Error, failure: result.failure } });
        return;
      }
      set({ drafts: result.value.items, listState: { status: StoreStatus.Loaded } });
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
    getDraft: async (id) => {
      const result = await deps.getDraftUseCase.execute(id);
      if (!result.ok) {
        return null;
      }
      return result.value;
    },
    clear: () => set({ drafts: [], listState: { status: StoreStatus.Idle }, latestDraft: null }),
  }));
};
