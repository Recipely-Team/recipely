import { configureFeedbackStore } from '@application/feedback/feedback-store';
import type { SubmitFeedbackUseCase } from '@application/feedback/submit-feedback-use-case';
import { NetworkFailure, UnknownFailure, ValidationFailure } from '@core/failure';
import { fail, ok } from '@core/result/result-helpers';

const INPUT = { subject: 'Bug report', message: 'Something is broken' };

const makeStore = (executeFn: SubmitFeedbackUseCase['execute']) => {
  const submitFeedbackUseCase = {
    execute: executeFn,
  } as unknown as SubmitFeedbackUseCase;

  return configureFeedbackStore({ submitFeedbackUseCase });
};

describe('configureFeedbackStore', () => {
  describe('initial state', () => {
    it('starts with isSubmitting false and error null', () => {
      const execute = jest.fn().mockResolvedValue(ok(undefined));
      const store = makeStore(execute);

      expect(store.getState().isSubmitting).toBe(false);
      expect(store.getState().error).toBeNull();
    });
  });

  describe('submit — success', () => {
    it('returns true when the use case succeeds', async () => {
      const execute = jest.fn().mockResolvedValue(ok(undefined));
      const store = makeStore(execute);

      const result = await store.getState().submit(INPUT);

      expect(result).toBe(true);
    });

    it('leaves error as null after a successful submit', async () => {
      const execute = jest.fn().mockResolvedValue(ok(undefined));
      const store = makeStore(execute);

      await store.getState().submit(INPUT);

      expect(store.getState().error).toBeNull();
    });

    it('resets isSubmitting to false after a successful submit', async () => {
      const execute = jest.fn().mockResolvedValue(ok(undefined));
      const store = makeStore(execute);

      await store.getState().submit(INPUT);

      expect(store.getState().isSubmitting).toBe(false);
    });

    it('calls the use case exactly once with the given input', async () => {
      const execute = jest.fn().mockResolvedValue(ok(undefined));
      const store = makeStore(execute);

      await store.getState().submit(INPUT);

      expect(execute).toHaveBeenCalledTimes(1);
      expect(execute).toHaveBeenCalledWith(INPUT);
    });
  });

  describe('submit — use case returns a failure', () => {
    it('returns false when the use case returns a failure result', async () => {
      const failure = new ValidationFailure('Message is required', 'message');
      const execute = jest.fn().mockResolvedValue(fail(failure));
      const store = makeStore(execute);

      const result = await store.getState().submit(INPUT);

      expect(result).toBe(false);
    });

    it('sets error to the failure returned by the use case', async () => {
      const failure = new NetworkFailure('offline');
      const execute = jest.fn().mockResolvedValue(fail(failure));
      const store = makeStore(execute);

      await store.getState().submit(INPUT);

      expect(store.getState().error).toBe(failure);
    });

    it('resets isSubmitting to false after a failed result', async () => {
      const failure = new ValidationFailure('Message is required', 'message');
      const execute = jest.fn().mockResolvedValue(fail(failure));
      const store = makeStore(execute);

      await store.getState().submit(INPUT);

      expect(store.getState().isSubmitting).toBe(false);
    });
  });

  describe('submit — use case throws', () => {
    it('returns false when the use case throws', async () => {
      const execute = jest.fn().mockRejectedValue(new Error('Unexpected crash'));
      const store = makeStore(execute);

      const result = await store.getState().submit(INPUT);

      expect(result).toBe(false);
    });

    it('sets error to an UnknownFailure when the use case throws', async () => {
      const execute = jest.fn().mockRejectedValue(new Error('Unexpected crash'));
      const store = makeStore(execute);

      await store.getState().submit(INPUT);

      expect(store.getState().error).toBeInstanceOf(UnknownFailure);
    });

    it('does not produce an unhandled rejection when the use case throws', async () => {
      const execute = jest.fn().mockRejectedValue(new Error('Unexpected crash'));
      const store = makeStore(execute);

      await expect(store.getState().submit(INPUT)).resolves.toBe(false);
    });

    it('resets isSubmitting to false when the use case throws', async () => {
      const execute = jest.fn().mockRejectedValue(new Error('Unexpected crash'));
      const store = makeStore(execute);

      await store.getState().submit(INPUT);

      expect(store.getState().isSubmitting).toBe(false);
    });
  });

  describe('reset', () => {
    it('clears error back to null', async () => {
      const failure = new NetworkFailure('offline');
      const execute = jest.fn().mockResolvedValue(fail(failure));
      const store = makeStore(execute);
      await store.getState().submit(INPUT);
      expect(store.getState().error).not.toBeNull();

      store.getState().reset();

      expect(store.getState().error).toBeNull();
    });

    it('resets isSubmitting to false', () => {
      const execute = jest.fn().mockResolvedValue(ok(undefined));
      const store = makeStore(execute);
      store.setState({ isSubmitting: true });

      store.getState().reset();

      expect(store.getState().isSubmitting).toBe(false);
    });
  });
});
