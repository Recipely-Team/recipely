import type { Failure } from '@core/failure';
import type { StoreStatus } from '@application/store/store-status';
import type { ImportJob } from '@domain/recipes/import/import-job';

/**
 * The screen's view of one queued Instagram import.
 *
 * @remarks
 * `Loaded` means "the backend has a job for us", NOT "the import finished" —
 * where the work has got to is the job's own `status` (`queued` / `running` /
 * `done` / `failed`), which is the backend's vocabulary and not re-spelled
 * here. The two layers of state are deliberate: the request to enqueue can fail
 * on its own (no network) while the job it would have created cannot.
 */
export type ImportJobState =
  | { status: typeof StoreStatus.Idle }
  | { status: typeof StoreStatus.Loading }
  | { status: typeof StoreStatus.Loaded; job: ImportJob }
  | { status: typeof StoreStatus.Error; failure: Failure };
