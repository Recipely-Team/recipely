import { NetworkFailure } from '@core/failure';
import { fail, ok } from '@core/result/result-helpers';
import { ApiRoutes } from '@infrastructure/constants/api/api-routes';
import { FeatureFlagRepository } from '@infrastructure/flags/feature-flag-repository';
import type { HttpClient } from '@infrastructure/network/http/http-client';

const repoAnswering = (value: ReturnType<HttpClient['get']>) => {
  const get = jest.fn().mockReturnValue(value);
  return { repo: new FeatureFlagRepository({ get } as unknown as HttpClient), get };
};

describe('FeatureFlagRepository', () => {
  it('reads the boolean overrides from GET /flags', async () => {
    const { repo, get } = repoAnswering(Promise.resolve(ok({ flags: { instagramAutomations: true } })));
    expect(await repo.fetchOverrides()).toEqual(ok({ instagramAutomations: true }));
    expect(get).toHaveBeenCalledWith(ApiRoutes.flags);
  });

  it('drops values that are not booleans and survives a missing map', async () => {
    const odd = repoAnswering(Promise.resolve(ok({ flags: { a: 'on', b: false } })));
    expect(await odd.repo.fetchOverrides()).toEqual(ok({ b: false }));
    const empty = repoAnswering(Promise.resolve(ok({})));
    expect(await empty.repo.fetchOverrides()).toEqual(ok({}));
  });

  it('passes a network failure through', async () => {
    const failure = new NetworkFailure('offline');
    const { repo } = repoAnswering(Promise.resolve(fail(failure)));
    expect(await repo.fetchOverrides()).toEqual(fail(failure));
  });
});
