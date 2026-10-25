import { prepareIntegrityTokenProviderAsync, requestIntegrityCheckAsync } from '@expo/app-integrity';
import { digestStringAsync } from 'expo-crypto';
import { PlayIntegrityAttestor } from '@infrastructure/integrity/play-integrity-attestor';

jest.mock('@expo/app-integrity', () => ({
  prepareIntegrityTokenProviderAsync: jest.fn(),
  requestIntegrityCheckAsync: jest.fn(),
}));
jest.mock('expo-crypto', () => ({
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
  digestStringAsync: jest.fn(),
}));

const prepare = jest.mocked(prepareIntegrityTokenProviderAsync);
const check = jest.mocked(requestIntegrityCheckAsync);
const digest = jest.mocked(digestStringAsync);

describe('PlayIntegrityAttestor', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    digest.mockResolvedValue('hash-of-binding');
  });

  it('asks Google for a token over the hash of the binding, preparing the provider once', async () => {
    prepare.mockResolvedValue(undefined);
    check.mockResolvedValue('token');
    const attestor = new PlayIntegrityAttestor('123');

    const first = await attestor.headersFor('POST /recipes/generate\nrid-1');
    await attestor.headersFor('POST /recipes/generate\nrid-2');

    expect(prepare).toHaveBeenCalledTimes(1);
    expect(prepare).toHaveBeenCalledWith('123');
    expect(digest).toHaveBeenCalledWith('SHA-256', 'POST /recipes/generate\nrid-1');
    expect(check).toHaveBeenCalledWith('hash-of-binding');
    expect(first).toEqual({ 'X-App-Attestation-Platform': 'android', 'X-App-Attestation': 'token' });
  });

  it('sends no proof when preparation fails, and prepares again on the next request', async () => {
    prepare.mockRejectedValueOnce(new Error('no play services')).mockResolvedValue(undefined);
    check.mockResolvedValue('token');
    const attestor = new PlayIntegrityAttestor('123');

    expect(await attestor.headersFor('b')).toBeNull();
    expect(await attestor.headersFor('b')).not.toBeNull();
    expect(prepare).toHaveBeenCalledTimes(2);
  });

  it('sends no proof when the token request fails, and prepares a fresh provider after it', async () => {
    prepare.mockResolvedValue(undefined);
    check.mockRejectedValueOnce(new Error('expired')).mockResolvedValue('token');
    const attestor = new PlayIntegrityAttestor('123');

    expect(await attestor.headersFor('b')).toBeNull();
    expect(await attestor.headersFor('b')).not.toBeNull();
    expect(prepare).toHaveBeenCalledTimes(2);
  });
});
