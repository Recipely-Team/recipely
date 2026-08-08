/**
 * The queued Instagram import: one enqueue, then polls until the worker is done.
 *
 * The invariant behind most of these cases is that **the job outlives the
 * screen**. The user is told they can close the app and be notified, so nothing
 * here may treat leaving as cancelling, and a poll that fails is not an import
 * that failed — the work is on a worker either way.
 */

import { configureImportJobStore } from '@application/recipes/import/import-job-store';
import type { EnqueueInstagramImportUseCase } from '@application/recipes/import/enqueue-instagram-import-use-case';
import type { GetImportJobUseCase } from '@application/recipes/import/get-import-job-use-case';
import type { ImportJob } from '@domain/recipes/import/import-job';
import { ImportJobStatus } from '@domain/recipes/import/import-job-status';
import { NetworkFailure } from '@core/failure';
import { fail, ok } from '@core/result/result-helpers';

const REEL = 'https://www.instagram.com/reel/abc/';

const job = (overrides: Partial<ImportJob> = {}): ImportJob => ({
  id: 'job-1',
  status: ImportJobStatus.Queued,
  draftId: null,
  errorKey: null,
  ...overrides,
});

interface Calls {
  enqueue: jest.Mock;
  get: jest.Mock;
}

const makeStore = (calls: Partial<Calls> = {}) => {
  const enqueue = calls.enqueue ?? jest.fn().mockResolvedValue(ok(job()));
  const get = calls.get ?? jest.fn().mockResolvedValue(ok(job()));
  const store = configureImportJobStore({
    enqueueInstagramImportUseCase: { execute: enqueue } as unknown as EnqueueInstagramImportUseCase,
    getImportJobUseCase: { execute: get } as unknown as GetImportJobUseCase,
  });
  return { store, enqueue, get };
};

describe('importJobStore.startImport', () => {
  it('starts idle', () => {
    const { store } = makeStore();

    expect(store.getState().state).toEqual({ status: 'idle' });
  });

  it('holds the receipt the backend hands back', async () => {
    const queued = job({ id: 'job-7' });
    const { store } = makeStore({ enqueue: jest.fn().mockResolvedValue(ok(queued)) });

    await store.getState().startImport(REEL);

    expect(store.getState().state).toEqual({ status: 'loaded', job: queued });
  });

  it('records a failed enqueue — no job was created, so there is nothing to poll', async () => {
    const failure = new NetworkFailure('offline');
    const { store } = makeStore({ enqueue: jest.fn().mockResolvedValue(fail(failure)) });

    await store.getState().startImport(REEL);

    expect(store.getState().state).toEqual({ status: 'error', failure });
  });

  it('discards an enqueue answer that lands after the screen was left', async () => {
    let release!: () => void;
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    const { store } = makeStore({
      enqueue: jest.fn().mockImplementation(async () => {
        await held;
        return ok(job());
      }),
    });

    const inFlight = store.getState().startImport(REEL);
    store.getState().clear();
    release();
    await inFlight;

    expect(store.getState().state).toEqual({ status: 'idle' });
  });
});

describe('importJobStore.refreshJob', () => {
  it('does nothing before there is a job to ask about', async () => {
    const { store, get } = makeStore();

    await store.getState().refreshJob();

    expect(get).not.toHaveBeenCalled();
  });

  it('advances the job as the worker moves', async () => {
    const running = job({ status: ImportJobStatus.Running });
    const { store, get } = makeStore({ get: jest.fn().mockResolvedValue(ok(running)) });
    await store.getState().startImport(REEL);

    await store.getState().refreshJob();

    expect(get).toHaveBeenCalledWith('job-1');
    expect(store.getState().state).toEqual({ status: 'loaded', job: running });
  });

  it('stops asking once the job is done', async () => {
    const done = job({ status: ImportJobStatus.Done, draftId: 'draft-9' });
    const get = jest.fn().mockResolvedValue(ok(done));
    const { store } = makeStore({ get });
    await store.getState().startImport(REEL);
    await store.getState().refreshJob();
    expect(get).toHaveBeenCalledTimes(1);

    // The screen's interval keeps firing until it is torn down; a finished job
    // has nothing left to report, so further polls must be free.
    await store.getState().refreshJob();
    await store.getState().refreshJob();

    expect(get).toHaveBeenCalledTimes(1);
    expect(store.getState().state).toEqual({ status: 'loaded', job: done });
  });

  it('stops asking once the job has failed', async () => {
    const failed = job({ status: ImportJobStatus.Failed, errorKey: 'errors.import.no_audio' });
    const get = jest.fn().mockResolvedValue(ok(failed));
    const { store } = makeStore({ get });
    await store.getState().startImport(REEL);
    await store.getState().refreshJob();

    await store.getState().refreshJob();

    expect(get).toHaveBeenCalledTimes(1);
  });

  it('keeps the last good answer when a poll fails', async () => {
    const get = jest
      .fn()
      .mockResolvedValueOnce(ok(job({ status: ImportJobStatus.Running })))
      .mockResolvedValueOnce(fail(new NetworkFailure('offline')));
    const { store } = makeStore({ get });
    await store.getState().startImport(REEL);
    await store.getState().refreshJob();

    await store.getState().refreshJob();

    // A dropped poll is not a dropped import: the worker is still working and
    // the notification is still coming, so the screen must not flip to an error.
    expect(store.getState().state).toEqual({
      status: 'loaded',
      job: job({ status: ImportJobStatus.Running }),
    });
  });

  it('discards a poll answer that lands after the screen was left', async () => {
    let release!: () => void;
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    const get = jest.fn().mockImplementation(async () => {
      await held;
      return ok(job({ status: ImportJobStatus.Done, draftId: 'draft-9' }));
    });
    const { store } = makeStore({ get });
    await store.getState().startImport(REEL);

    const inFlight = store.getState().refreshJob();
    store.getState().clear();
    release();
    await inFlight;

    expect(store.getState().state).toEqual({ status: 'idle' });
  });
});
