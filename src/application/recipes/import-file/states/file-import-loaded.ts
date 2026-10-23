import type { StoreStatus } from '@application/store/store-status';
import type { FileImportReceipt } from '@domain/recipes/import-file/file-import-receipt';

export interface FileImportLoaded {
  status: typeof StoreStatus.Loaded;
  receipt: FileImportReceipt;
}
