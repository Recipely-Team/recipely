import { NetworkFailure } from '@core/failure';
import { fail, ok } from '@core/result/result-helpers';
import { ApiRoutes } from '@infrastructure/constants/api/api-routes';
import { AppVersionRepository } from '@infrastructure/app-version/app-version-repository';
import { toVersionVerdict } from '@infrastructure/app-version/to-version-verdict';
import type { AxiosHttpClient } from '@infrastructure/network/http/axios-http-client';

const IOS_BUILD = { platform: 'ios', version: '1.2.0' };

const repoAnswering = (answer: unknown, build: { platform: string; version: string } | null = IOS_BUILD) => {
  const get = jest.fn().mockResolvedValue(answer);
  return { repo: new AppVersionRepository({ get } as unknown as AxiosHttpClient, build), get };
};

describe('AppVersionRepository', () => {
  it('asks GET /app/version about this platform and version', async () => {
    const body = { status: 'updateRequired', reason: 'blocked', latestVersion: '1.4.0', minimumVersion: '1.0.0', storeUrl: 'https://apps.apple.com/app/id1' };
    const { repo, get } = repoAnswering(ok(body));

    const result = await repo.check();

    expect(get).toHaveBeenCalledWith(ApiRoutes.appVersion, { params: IOS_BUILD });
    expect(result).toEqual(ok(body));
  });

  it('answers up to date on the web without a request', async () => {
    const { repo, get } = repoAnswering(ok({}), null);

    expect(await repo.check()).toEqual(ok(expect.objectContaining({ status: 'upToDate' })));
    expect(get).not.toHaveBeenCalled();
  });

  it('passes a network failure on, so the store can fail open', async () => {
    const failure = new NetworkFailure('offline');
    const { repo } = repoAnswering(fail(failure));

    expect(await repo.check()).toEqual(fail(failure));
  });
});

describe('toVersionVerdict', () => {
  // A newer backend word must leave the app running, not guess at a block.
  it('refuses a status this build does not know', () => {
    expect(toVersionVerdict({ status: 'mustDance' }).ok).toBe(false);
  });

  // The link is opened with the OS: only an https store page is trusted.
  it.each(['javascript:alert(1)', 'intent://evil', 'http://apps.apple.com/app/id1', 42])(
    'drops a store link that is not https: %p',
    (storeUrl) => {
      const verdict = toVersionVerdict({ status: 'updateAvailable', storeUrl });
      expect(verdict.ok && verdict.value.storeUrl).toBeNull();
    },
  );

  it('drops an unknown reason', () => {
    const verdict = toVersionVerdict({ status: 'updateRequired', reason: 'whatever' });
    expect(verdict.ok && verdict.value.reason).toBeNull();
  });
});
