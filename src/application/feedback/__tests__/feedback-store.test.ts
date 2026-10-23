import { configureFeedbackStore } from '@application/feedback/feedback-store';
import type { SubmitFeedbackUseCase } from '@application/feedback/submit-feedback-use-case';
import { NetworkFailure, UnknownFailure } from '@core/failure';
import { fail, ok } from '@core/result/result-helpers';

const INPUT = { subject: 'Bug report', message: 'Something is broken' };

const makeStore = (execute: jest.Mock) =>
  configureFeedbackStore({ submitFeedbackUseCase: { execute } as unknown as SubmitFeedbackUseCase });

describe('configureFeedbackStore', () => {
  it('answers null once the message is sent, and is no longer submitting', async () => {
    const execute = jest.fn().mockResolvedValue(ok(undefined));
    const store = makeStore(execute);

    expect(await store.getState().submit(INPUT)).toBeNull();
    expect(execute).toHaveBeenCalledWith(INPUT);
    expect(store.getState().isSubmitting).toBe(false);
  });

  it('is submitting while the request is on its way', async () => {
    let finish: () => void = () => undefined;
    const store = makeStore(jest.fn(() => new Promise((resolve) => { finish = () => resolve(ok(undefined)); })));

    const pending = store.getState().submit(INPUT);
    expect(store.getState().isSubmitting).toBe(true);
    finish();
    await pending;

    expect(store.getState().isSubmitting).toBe(false);
  });

  it('answers the failure to the caller that submitted', async () => {
    const failure = new NetworkFailure('offline');
    const store = makeStore(jest.fn().mockResolvedValue(fail(failure)));

    expect(await store.getState().submit(INPUT)).toBe(failure);
    expect(store.getState().isSubmitting).toBe(false);
  });

  it('turns a thrown error into an UnknownFailure instead of rejecting', async () => {
    const store = makeStore(jest.fn().mockRejectedValue(new Error('boom')));

    expect(await store.getState().submit(INPUT)).toBeInstanceOf(UnknownFailure);
  });

  // Regression: the store held one shared `error`. A report the assistant
  // failed to send left it set, and the feedback sheet opened later showed
  // that failure as its own. Each caller now gets its own answer and the
  // store keeps none.
  it('leaves nothing behind for the next caller after a failed submission', async () => {
    const execute = jest.fn().mockResolvedValueOnce(fail(new NetworkFailure('offline'))).mockResolvedValueOnce(ok(undefined));
    const store = makeStore(execute);

    await store.getState().submit(INPUT);

    expect(Object.keys(store.getState())).toEqual(['isSubmitting', 'submit']);
    expect(await store.getState().submit(INPUT)).toBeNull();
  });
});
