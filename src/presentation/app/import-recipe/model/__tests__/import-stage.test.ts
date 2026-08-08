/**
 * The import checklist shows four stages; the backend reports four STATES.
 * Those are not the same thing, and this is where the difference is decided.
 *
 * The rule that matters: nothing may tick the last box until the job itself
 * says `done`. A checklist that completes while the worker is still working is
 * a claim the user can catch being false — they are staring at it for two
 * minutes with nothing else to read.
 */

import { ImportJobStatus } from '@domain/recipes/import/import-job-status';
import { IMPORT_STAGE_COUNT, importStageFor } from '@presentation/app/import-recipe/model/import-stage';

describe('importStageFor', () => {
  it('shows nothing started while the job is queued', () => {
    expect(importStageFor(ImportJobStatus.Queued, 0)).toBe(0);
  });

  it('stays at the first stage however long the job sits in the queue', () => {
    // Waiting for a worker is not progress, and drawing it as progress would
    // make the estimate a lie the moment the queue is busy.
    expect(importStageFor(ImportJobStatus.Queued, 99)).toBe(0);
  });

  it('creeps forward while the job runs, so a long wait does not look frozen', () => {
    expect(importStageFor(ImportJobStatus.Running, 0)).toBe(0);
    expect(importStageFor(ImportJobStatus.Running, 1)).toBe(1);
    expect(importStageFor(ImportJobStatus.Running, 2)).toBe(2);
  });

  it('never reaches the last stage while the job is still running', () => {
    // THE RULE. The timer walks; only the backend may finish the list.
    for (const ticks of [3, 4, 10, 500]) {
      expect(importStageFor(ImportJobStatus.Running, ticks)).toBe(IMPORT_STAGE_COUNT - 2);
      expect(importStageFor(ImportJobStatus.Running, ticks)).toBeLessThan(IMPORT_STAGE_COUNT);
    }
  });

  it('fills every stage once the job reports done', () => {
    expect(importStageFor(ImportJobStatus.Done, 0)).toBe(IMPORT_STAGE_COUNT);
  });

  it('shows no progress for a failed job — the screen renders the failure instead', () => {
    expect(importStageFor(ImportJobStatus.Failed, 3)).toBe(0);
  });
});
