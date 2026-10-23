import type { StoreStatus } from '@application/store/store-status';
import type { ImportJob } from '@domain/recipes/import/import-job';

export interface ImportJobLoaded {
  status: typeof StoreStatus.Loaded;
  job: ImportJob;
}
