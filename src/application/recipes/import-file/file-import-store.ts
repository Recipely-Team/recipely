import type { StoreApi } from 'zustand/vanilla';
import { StoreStatus } from '@application/store/store-status';
import { createStore } from 'zustand/vanilla';
import { ValueConstants } from '@core/constants';
import type { ImportRecipeFromFilesUseCase } from '@application/recipes/import-file/import-recipe-from-files-use-case';
import type { FileImportStore } from '@application/recipes/import-file/file-import-store-contract';

interface FileImportStoreDeps {
  importRecipeFromFilesUseCase: ImportRecipeFromFilesUseCase;
}

/**
 * One file reading: the request, and its answer.
 *
 * @remarks
 * - **A late answer never lands on the next reading.** `clear()` bumps the
 *   session, so a reading the user walked away from cannot open its draft over
 *   whatever they did next.
 * - **The draft is the server's.** Leaving does not cancel it — a finished
 *   reading still lands in My Recipes as a draft.
 */
export const configureFileImportStore = (deps: FileImportStoreDeps): StoreApi<FileImportStore> => {
  let session = ValueConstants.zero;

  return createStore<FileImportStore>((set) => ({
    state: { status: StoreStatus.Idle },
    importFiles: async (files) => {
      const requested = session;
      set({ state: { status: StoreStatus.Loading } });
      const result = await deps.importRecipeFromFilesUseCase.execute(files);
      if (requested !== session) return;
      set({
        state: result.ok
          ? { status: StoreStatus.Loaded, receipt: result.value }
          : { status: StoreStatus.Error, failure: result.failure },
      });
    },
    clear: () => {
      session += ValueConstants.one;
      set({ state: { status: StoreStatus.Idle } });
    },
  }));
};
