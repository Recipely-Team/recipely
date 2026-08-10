import type { ImportJobStatus } from '@domain/recipes/import/import-job-status';

/**
 * The receipt an import request returns, and what a later check reports.
 *
 * @remarks
 * A read model rather than an entity: the app never transitions one of these.
 * Every state change happens on a worker and is reported by the backend, so
 * giving this behaviour would be inventing rules the client cannot enforce.
 */
export interface ImportJob {
  readonly id: string;
  readonly status: ImportJobStatus;
  /** Set once done — the draft the completion notification opens. */
  readonly draftId: string | null;
  /** Set once failed — a key the client turns into a sentence. */
  readonly errorKey: string | null;
  /**
   * Where the job sits in the queue — 1 means next — or `null` once it is no
   * longer waiting.
   *
   * Read-model only, and it belongs here for the same reason the rest of this
   * does: it is what the backend said when asked, not something the app can
   * derive or keep current. A build that predates the field reads `null`, which
   * is the same thing the screen does with a job that has started.
   */
  readonly queuePosition: number | null;
}
