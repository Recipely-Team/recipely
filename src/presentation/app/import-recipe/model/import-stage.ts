import { ImportJobStatus } from '@domain/recipes/import/import-job-status';
import { ValueConstants } from '@core/constants';

/** How many named stages the checklist shows. */
export const IMPORT_STAGE_COUNT = 4;

/**
 * How far down the stage checklist a job has got.
 *
 * @remarks
 * - **The backend reports four states, not four stages.** `queued` / `running`
 *   / `done` is all it knows, so the middle stages are a reading of `running`,
 *   not a claim about which one the worker is on. That is why `running` never
 *   reaches the last index on its own: a checklist that ticks every box while
 *   the work continues is a lie the user can catch.
 * - `elapsedTicks` lets a long `running` walk forward instead of freezing, and
 *   is clamped — the wait must never look finished until the job says it is.
 */
export const importStageFor = (status: ImportJobStatus, elapsedTicks: number): number => {
  if (status === ImportJobStatus.Done) return IMPORT_STAGE_COUNT;
  if (status === ImportJobStatus.Queued) return ValueConstants.zero;
  if (status === ImportJobStatus.Failed) return ValueConstants.zero;
  // Running: start at the first stage and creep, stopping one short of the end.
  const lastRunningStage = IMPORT_STAGE_COUNT - ValueConstants.two;
  return Math.min(lastRunningStage, Math.max(ValueConstants.zero, elapsedTicks));
};
