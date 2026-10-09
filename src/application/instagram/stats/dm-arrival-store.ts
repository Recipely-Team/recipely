import { create } from 'zustand';
import type { BoundStore } from '@application/store/bound-store';
import type { DmArrivalStoreState } from '@application/instagram/stats/dm-arrival-store-state';
import type { RecordDmOpenUseCase } from '@application/instagram/stats/record-dm-open-use-case';
import type { RecordDmSaveUseCase } from '@application/instagram/stats/record-dm-save-use-case';

interface DmArrivalStoreDeps {
  recordOpen: RecordDmOpenUseCase;
  recordSave: RecordDmSaveUseCase;
}

/**
 * **Arrivals from a creator's DM** — the recipe link a comment-to-DM reply
 * carries is `…/recipes/<id>?dm=<sendId>`; the creator's stats count its
 * opens and the saves that follow.
 *
 * @remarks
 * - **Kept for the whole app session, not the user session**: someone who
 *   arrives as a guest, signs in and then saves still counts — the sign-in
 *   round trip drops the query string, the store does not.
 * - **Each report is sent at most once** per attempt, and fire-and-forget: a
 *   lost report costs the creator one count, never the viewer an error.
 */
export const configureDmArrivalStore = (deps: DmArrivalStoreDeps): BoundStore<DmArrivalStoreState> => {
  const opened = new Set<string>();
  const saved = new Set<string>();

  return create<DmArrivalStoreState>((set, get) => ({
    arrivals: {},
    arrive: (recipeId, sendId) => {
      set({ arrivals: { ...get().arrivals, [recipeId]: sendId } });
      if (opened.has(sendId)) return;
      opened.add(sendId);
      void deps.recordOpen.execute(sendId);
    },
    saved: (recipeId) => {
      const sendId = get().arrivals[recipeId];
      if (sendId === undefined || saved.has(sendId)) return;
      saved.add(sendId);
      void deps.recordSave.execute(sendId, recipeId);
    },
  }));
};
