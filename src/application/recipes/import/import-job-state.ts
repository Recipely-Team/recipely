import type { ImportJobIdle } from '@application/recipes/import/states/import-job-idle';
import type { ImportJobLoading } from '@application/recipes/import/states/import-job-loading';
import type { ImportJobLoaded } from '@application/recipes/import/states/import-job-loaded';
import type { ImportJobError } from '@application/recipes/import/states/import-job-error';

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
  | ImportJobIdle
  | ImportJobLoading
  | ImportJobLoaded
  | ImportJobError;
