import { ImportJobStatus } from '@domain/recipes/import/import-job-status';
import type { ImportJob } from '@domain/recipes/import/import-job';

/** True while a worker has yet to finish the job — queued or running — so a poll can still change it. */
export const isImportJobPending = (job: ImportJob): boolean =>
  job.status === ImportJobStatus.Queued || job.status === ImportJobStatus.Running;
