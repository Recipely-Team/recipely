import { fail, ok } from '@core/result/result-helpers';
import { NetworkFailure } from '@core/failure';
import { ApiRoutes } from '@infrastructure/constants/api/api-routes';
import { AssistantTokenRepository } from '@infrastructure/assistant/token/assistant-token-repository';
import type { HttpClient } from '@infrastructure/network/http/http-client';

const repoAnswering = (answer: unknown) => {
  const post = jest.fn().mockResolvedValue(answer);
  return { repo: new AssistantTokenRepository({ post } as unknown as HttpClient), post };
};

describe('AssistantTokenRepository', () => {
  it('mints a session with the language, adding the resumption handle only when there is one', async () => {
    const { repo, post } = repoAnswering(ok({ token: 't', model: 'm', wsUrl: 'wss://x' }));
    await repo.mintSession('tr');
    await repo.mintSession('tr', 'h1');
    expect(post).toHaveBeenNthCalledWith(1, ApiRoutes.assistant.session, { languageCode: 'tr' });
    expect(post).toHaveBeenNthCalledWith(2, ApiRoutes.assistant.session, { languageCode: 'tr', resumptionHandle: 'h1' });
  });

  it('reports usage and reads the remaining budget, defaulting what the server leaves out', async () => {
    const { repo, post } = repoAnswering(ok({}));
    expect(await repo.reportUsage(30)).toEqual(ok({ remainingSeconds: 0, isUnlimited: false }));
    expect(post).toHaveBeenCalledWith(ApiRoutes.assistant.heartbeat, { seconds: 30 });
  });

  it('passes HTTP failures through', async () => {
    const failure = new NetworkFailure('offline');
    const { repo } = repoAnswering(fail(failure));
    expect(await repo.mintSession('en')).toEqual(fail(failure));
    expect(await repo.reportUsage(1)).toEqual(fail(failure));
  });
});
