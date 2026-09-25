import type { ImportFile } from '@domain/recipes/import-file/import-file';
import type { FileImportState } from '@application/recipes/import-file/file-import-state';

export interface FileImportStoreState {
  state: FileImportState;
  /** Sends the pages, in order, to be read into a draft. */
  importFiles: (files: readonly ImportFile[]) => Promise<void>;
  /** Forgets the reading. Called when the screen is left and on sign-out. */
  clear: () => void;
}
