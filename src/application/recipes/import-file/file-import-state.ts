import type { Failure } from '@core/failure';
import type { StoreStatus } from '@application/store/store-status';
import type { FileImportReceipt } from '@domain/recipes/import-file/file-import-receipt';

/** One reading of picked pages: not started, being read, read into a draft, or refused. */
export type FileImportState =
  | { status: typeof StoreStatus.Idle }
  | { status: typeof StoreStatus.Loading }
  | { status: typeof StoreStatus.Loaded; receipt: FileImportReceipt }
  | { status: typeof StoreStatus.Error; failure: Failure };
