import { SubmitFeedbackUseCase } from '@application/feedback/submit-feedback-use-case';
import { ValidationFailure, NetworkFailure } from '@core/failure';
import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { FeedbackRepositoryInterface } from '@domain/feedback/feedback-repository-interface';
import type { FeedbackSubmission } from '@domain/feedback/feedback-submission';

interface SubmitCall {
  input: FeedbackSubmission;
}

const makeRepo = (
  result: Result<void, Failure>,
): { repo: FeedbackRepositoryInterface; calls: SubmitCall[] } => {
  const calls: SubmitCall[] = [];
  const repo: FeedbackRepositoryInterface = {
    submitFeedback: (input: FeedbackSubmission) => {
      calls.push({ input });
      return Promise.resolve(result);
    },
  };
  return { repo, calls };
};

describe('SubmitFeedbackUseCase.execute', () => {
  describe('validation', () => {
    it('returns a ValidationFailure when message is empty', async () => {
      const { repo, calls } = makeRepo(ok(void 0));
      const useCase = new SubmitFeedbackUseCase(repo);

      const result = await useCase.execute({ subject: 'Title', message: '' });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.failure).toBeInstanceOf(ValidationFailure);
        expect((result.failure as ValidationFailure).field).toBe('message');
      }
      expect(calls).toHaveLength(0);
    });

    it('returns a ValidationFailure when message is only whitespace', async () => {
      const { repo, calls } = makeRepo(ok(void 0));
      const useCase = new SubmitFeedbackUseCase(repo);

      const result = await useCase.execute({ subject: '', message: '   \t\n  ' });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.failure).toBeInstanceOf(ValidationFailure);
      }
      expect(calls).toHaveLength(0);
    });
  });

  describe('successful submission', () => {
    it('calls repo with trimmed message when message is valid', async () => {
      const { repo, calls } = makeRepo(ok(void 0));
      const useCase = new SubmitFeedbackUseCase(repo);

      const result = await useCase.execute({ subject: 'Hello', message: '  My feedback  ' });

      expect(result.ok).toBe(true);
      expect(calls).toHaveLength(1);
      expect(calls[0].input.message).toBe('My feedback');
    });

    it('calls repo with trimmed subject', async () => {
      const { repo, calls } = makeRepo(ok(void 0));
      const useCase = new SubmitFeedbackUseCase(repo);

      await useCase.execute({ subject: '  Some title  ', message: 'Valid message' });

      expect(calls[0].input.subject).toBe('Some title');
    });

    it('calls repo with empty subject when subject is blank', async () => {
      const { repo, calls } = makeRepo(ok(void 0));
      const useCase = new SubmitFeedbackUseCase(repo);

      await useCase.execute({ subject: '   ', message: 'Valid message' });

      expect(calls[0].input.subject).toBe('');
    });

    it('returns ok(void) on success', async () => {
      const { repo } = makeRepo(ok(void 0));
      const useCase = new SubmitFeedbackUseCase(repo);

      const result = await useCase.execute({ subject: '', message: 'Valid message' });

      expect(result.ok).toBe(true);
    });
  });

  describe('failure propagation', () => {
    it('propagates repo failure unchanged', async () => {
      const failure = new NetworkFailure('offline');
      const { repo } = makeRepo(fail(failure));
      const useCase = new SubmitFeedbackUseCase(repo);

      const result = await useCase.execute({ subject: '', message: 'Valid message' });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.failure).toBe(failure);
      }
    });
  });
});
