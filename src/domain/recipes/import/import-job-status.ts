import { isString } from '@core/guards/type-guards';

/**
 * Where a queued Instagram import currently is.
 *
 * @remarks
 * Mirrors the backend's `ImportJobStatus` wire values exactly. It is written
 * down here rather than compared as a literal because the app discriminates on
 * it, and a mistyped `'quued'` in a comparison compiles and simply never
 * matches — the screen would sit on "waiting" for a job that finished.
 */
export const ImportJobStatus = {
  Queued: 'queued',
  Running: 'running',
  Done: 'done',
  Failed: 'failed',
} as const;

// eslint-disable-next-line @typescript-eslint/no-redeclare -- intentional enum-style value + type pairing
export type ImportJobStatus = (typeof ImportJobStatus)[keyof typeof ImportJobStatus];

const IMPORT_JOB_STATUS_SET: ReadonlySet<string> = new Set(Object.values(ImportJobStatus));

export const isImportJobStatus = (v: unknown): v is ImportJobStatus =>
  isString(v) && IMPORT_JOB_STATUS_SET.has(v);
