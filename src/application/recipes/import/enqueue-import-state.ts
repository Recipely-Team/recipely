import type { Failure } from '@core/failure';
import type { StoreStatus } from '@application/store/store-status';
import type { ImportJob } from '@domain/recipes/import/import-job';

/**
 * The state of ASKING for a background import — not of the import itself.
 *
 * `Success` means the job was accepted, not that a recipe exists: the work
 * happens on a worker minutes later, and the user learns of it by notification.
 * Conflating the two would put a "done" in front of someone whose import has
 * not started.
 */
export type EnqueueImportState =
  | { status: typeof StoreStatus.Idle }
  | { status: typeof StoreStatus.Loading }
  | { status: typeof StoreStatus.Success; job: ImportJob }
  | { status: typeof StoreStatus.Error; failure: Failure };
