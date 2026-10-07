import { isImportJobPending } from '@domain/recipes/import/is-import-job-pending';
import { ImportJobStatus } from '@domain/recipes/import/import-job-status';
import type { ImportJob } from '@domain/recipes/import/import-job';

const jobIn = (status: ImportJobStatus): ImportJob => ({
  id: 'job-1',
  status,
  draftId: null,
  errorKey: null,
  queuePosition: null,
});

describe('isImportJobPending', () => {
  it.each([ImportJobStatus.Queued, ImportJobStatus.Running])('is pending while %s', (status) => {
    expect(isImportJobPending(jobIn(status))).toBe(true);
  });

  it.each([ImportJobStatus.Done, ImportJobStatus.Failed])('is settled once %s', (status) => {
    expect(isImportJobPending(jobIn(status))).toBe(false);
  });
});
