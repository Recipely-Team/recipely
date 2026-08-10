import type { ImportJobState } from '@application/recipes/import/import-job-state';

export interface ImportJobStoreState {
  state: ImportJobState;
  /** Queues the reel and keeps the receipt. */
  startImport: (url: string) => Promise<void>;
  /**
   * Re-reads the job. No-op unless a job is in hand and still running — a
   * finished job has nothing left to report, and asking anyway would keep a
   * poll alive forever.
   */
  refreshJob: () => Promise<void>;
  /** Drops the receipt. Called when the screen is left and on sign-out. */
  clear: () => void;
}
