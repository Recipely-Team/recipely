import type { BoundStore } from '@application/store/bound-store';
import { StoreStatus } from '@application/store/store-status';
import { create } from 'zustand';
import { ImportJobStatus } from '@domain/recipes/import/import-job-status';
import { ValueConstants } from '@core/constants';
import type { EnqueueInstagramImportUseCase } from '@application/recipes/import/enqueue-instagram-import-use-case';
import type { GetImportJobUseCase } from '@application/recipes/import/get-import-job-use-case';
import type { ImportJobStoreState } from '@application/recipes/import/import-job-store-state';

interface ImportJobStoreDeps {
  enqueueInstagramImportUseCase: EnqueueInstagramImportUseCase;
  getImportJobUseCase: GetImportJobUseCase;
}

/**
 * One queued Instagram import: the enqueue, and the polls that follow it.
 *
 * @remarks
 * - **The job outlives the screen.** The user is told they can leave, and the
 *   result arrives as a notification — so nothing here may treat being left as
 *   cancelling. `clear()` drops OUR copy of the receipt; the work carries on.
 * - **A poll never revives a finished job.** `refreshJob` returns early unless
 *   there is a job that is still queued or running, so the screen's interval
 *   can keep firing harmlessly until it is torn down.
 */
export const configureImportJobStore = (deps: ImportJobStoreDeps): BoundStore<ImportJobStoreState> => {
  /** Bumped by `clear()`, so an answer from a previous import cannot land in the next one. */
  let session = ValueConstants.zero;
  /**
   * True while a poll is out. The screen re-asks on a fixed interval, so a slow
   * or hanging request would otherwise stack two or three at a time on exactly
   * the connection that is already struggling.
   */
  let isPolling = false;

  return create<ImportJobStoreState>((set, get) => ({
    state: { status: StoreStatus.Idle },
    startImport: async (url) => {
      const requested = session;
      set({ state: { status: StoreStatus.Loading } });
      const result = await deps.enqueueInstagramImportUseCase.execute({ url });
      if (requested !== session) return;
      set({
        state: result.ok
          ? { status: StoreStatus.Loaded, job: result.value }
          : { status: StoreStatus.Error, failure: result.failure },
      });
    },
    refreshJob: async () => {
      const current = get().state;
      if (isPolling || current.status !== StoreStatus.Loaded) return;
      const { job } = current;
      if (job.status !== ImportJobStatus.Queued && job.status !== ImportJobStatus.Running) return;

      const requested = session;
      isPolling = true;
      try {
        const result = await deps.getImportJobUseCase.execute(job.id);
        if (requested !== session || !result.ok) {
          // A failed poll is not a failed import: the job is still on the
          // worker, and the notification remains the promise. Keep the last
          // good answer.
          return;
        }
        set({ state: { status: StoreStatus.Loaded, job: result.value } });
      } finally {
        isPolling = false;
      }
    },
    clear: () => {
      session += ValueConstants.one;
      isPolling = false;
      set({ state: { status: StoreStatus.Idle } });
    },
  }));
};
