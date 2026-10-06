import { fail, ok } from '@core/result/result-helpers';
import { NetworkFailure } from '@core/failure';
import { ApiRoutes } from '@infrastructure/constants/api/api-routes';
import { FeedbackRepository } from '@infrastructure/feedback/feedback-repository';
import type { HttpClient } from '@infrastructure/network/http/http-client';

describe('FeedbackRepository', () => {
  it('posts the mapped submission to the feedback route', async () => {
    const post = jest.fn().mockResolvedValue(ok({}));
    const repo = new FeedbackRepository({ post } as unknown as HttpClient);
    expect(await repo.submitFeedback({ subject: ' Hi ', message: 'Body' })).toEqual(ok(undefined));
    expect(post).toHaveBeenCalledWith(ApiRoutes.feedback, expect.objectContaining({ subject: 'Hi', message: 'Body' }));
  });

  it('passes a failure through', async () => {
    const failure = new NetworkFailure('offline');
    const repo = new FeedbackRepository({ post: jest.fn().mockResolvedValue(fail(failure)) } as unknown as HttpClient);
    expect(await repo.submitFeedback({ subject: '', message: 'Body' })).toEqual(fail(failure));
  });
});
