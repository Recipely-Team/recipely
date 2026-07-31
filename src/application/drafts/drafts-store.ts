import type { StoreApi, UseBoundStore } from 'zustand';
import { create } from 'zustand';
import type { DraftsStoreState } from '@application/drafts/drafts-store-state';
import type { DraftsStoreDeps } from '@application/drafts/drafts-store-deps';
import { DRAFTS_PAGE_SIZE } from '@infrastructure/constants/api';

export const configureDraftsStore = (deps: DraftsStoreDeps): DraftsStore => {
  return create<DraftsStoreState>((set, get) => ({
    drafts: [],
    listState: { status: 'idle' },
    latestDraft: null,
    loadDrafts: async () => {
      set({ listState: { status: 'loading' } });
      const result = await deps.listDraftsUseCase.execute({
        page: 1,
        pageSize: DRAFTS_PAGE_SIZE,
      });
      if (!result.ok) {
        set({ listState: { status: 'error', failure: result.failure } });
        return;
      }
      set({ drafts: result.value.items, listState: { status: 'loaded' } });
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
    clear: () => set({ drafts: [], listState: { status: 'idle' }, latestDraft: null }),
  }));
};

/** Bound Zustand store handle produced by `configureDraftsStore`. */
export type DraftsStore = UseBoundStore<StoreApi<DraftsStoreState>>;
