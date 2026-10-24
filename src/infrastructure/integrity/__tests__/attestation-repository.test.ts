import { fail, ok } from '@core/result/result-helpers';
import { NetworkFailure } from '@core/failure';
import { ApiRoutes } from '@infrastructure/constants/api/api-routes';
import { AttestationRepository } from '@infrastructure/integrity/attestation-repository';
import type { AxiosHttpClient } from '@infrastructure/network/http/axios-http-client';

describe('AttestationRepository', () => {
  it('reads the challenge out of its envelope', async () => {
    const get = jest.fn().mockResolvedValue(ok({ challenge: 'c1' }));
    const repo = new AttestationRepository({ get } as unknown as AxiosHttpClient);

    expect(await repo.fetchChallenge()).toEqual(ok('c1'));
    expect(get).toHaveBeenCalledWith(ApiRoutes.attestation.challenge);
  });

  it('posts the attested key with the challenge it was made over', async () => {
    const post = jest.fn().mockResolvedValue(ok({}));
    const repo = new AttestationRepository({ post } as unknown as AxiosHttpClient);

    await repo.registerAppleKey({ keyId: 'k', attestation: 'a', challenge: 'c1' });

    expect(post).toHaveBeenCalledWith(ApiRoutes.attestation.appleKey, { keyId: 'k', attestation: 'a', challenge: 'c1' });
  });

  it('passes HTTP failures through', async () => {
    const failure = new NetworkFailure('offline');
    const repo = new AttestationRepository({ get: jest.fn().mockResolvedValue(fail(failure)) } as unknown as AxiosHttpClient);

    expect(await repo.fetchChallenge()).toEqual(fail(failure));
  });
});
