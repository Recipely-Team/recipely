import { ImportJobStatus } from '@domain/recipes/import/import-job-status';
import { ValueConstants } from '@core/constants';
import { SourcePlatform } from '@domain/recipes/provenance/source-platform';
import { importStageKeysFor } from '@presentation/app/import-recipe/model/import-stage-keys';

/** How many named stages a video import's checklist shows — read from the checklist itself. */
export const IMPORT_STAGE_COUNT = importStageKeysFor(SourcePlatform.Instagram).length;

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
 * - **`stageCount` is the checklist's length**, which is the platform's: a web
 *   page is read in three stages, a video in four.
 */
export const importStageFor = (
  status: ImportJobStatus,
  elapsedTicks: number,
  stageCount: number = IMPORT_STAGE_COUNT,
): number => {
  if (status === ImportJobStatus.Done) return stageCount;
  if (status === ImportJobStatus.Queued) return ValueConstants.zero;
  if (status === ImportJobStatus.Failed) return ValueConstants.zero;
  const lastRunningStage = stageCount - ValueConstants.two;
  return Math.min(lastRunningStage, Math.max(ValueConstants.zero, elapsedTicks));
};
