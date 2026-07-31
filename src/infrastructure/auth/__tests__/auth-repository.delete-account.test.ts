import { NetworkFailure, UnknownFailure } from '@core/failure';
import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import { AuthRepository } from '@infrastructure/auth/auth-repository';
import type { HttpClient } from '@infrastructure/network/http/http-client';
import type { SecureTokenStorage } from '@infrastructure/storage/secure-token-storage';
import { withHttpVerbs } from '@infrastructure/network/http/__fixtures__/with-http-verbs';

interface RequestCall {
  method?: string;
  url?: string;
}

const makeHttp = (
  result: Result<unknown, unknown>,
): { http: HttpClient; calls: RequestCall[] } => {
  const calls: RequestCall[] = [];
  const stub = withHttpVerbs(jest.fn((config: RequestCall) => {
      calls.push({ method: config.method, url: config.url });
      return Promise.resolve(result);
    }));
  return { http: stub, calls };
};

const makeStorage = (
  clearResult: Result<void, unknown> = ok(undefined),
): { storage: SecureTokenStorage; clear: jest.Mock } => {
  const clear = jest.fn(() => Promise.resolve(clearResult));
  const stub = { clear } as unknown as SecureTokenStorage;
  return { storage: stub, clear };
};

describe('AuthRepository.deleteAccount', () => {
  it('DELETEs /me and clears local storage on success', async () => {
    const { http, calls } = makeHttp(ok(undefined));
    const { storage, clear } = makeStorage();
    const repo = new AuthRepository(http, storage);

    const result = await repo.deleteAccount();

    expect(result.ok).toBe(true);
    expect(calls).toEqual([{ method: 'DELETE', url: '/me' }]);
    expect(clear).toHaveBeenCalledTimes(1);
  });

  it('returns the http failure and leaves storage untouched so the user stays signed in', async () => {
    const failure = new NetworkFailure('offline');
    const { http } = makeHttp(fail(failure));
    const { storage, clear } = makeStorage();
    const repo = new AuthRepository(http, storage);

    const result = await repo.deleteAccount();

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.failure).toBe(failure);
    expect(clear).not.toHaveBeenCalled();
  });

  it('propagates a storage clear failure after the server confirmed the deletion', async () => {
    const failure = new UnknownFailure('Failed to clear session');
    const { http } = makeHttp(ok(undefined));
    const { storage } = makeStorage(fail(failure));
    const repo = new AuthRepository(http, storage);

    const result = await repo.deleteAccount();

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.failure).toBe(failure);
  });
});
