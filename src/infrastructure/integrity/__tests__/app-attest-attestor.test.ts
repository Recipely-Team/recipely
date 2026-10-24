import { attestKeyAsync, generateAssertionAsync, generateKeyAsync } from '@expo/app-integrity';
import { fail, ok } from '@core/result/result-helpers';
import { type Failure, NetworkFailure } from '@core/failure';
import type { Result } from '@core/result/result';
import type { KeyValueStoreInterface } from '@domain/storage/key-value-store-interface';
import { AppAttestAttestor } from '@infrastructure/integrity/app-attest-attestor';
import type { AttestationRepository } from '@infrastructure/integrity/attestation-repository';
import { APP_ATTEST_KEY_STORAGE_KEY } from '@infrastructure/constants/storage';

const mockDevice = { isSupported: true };
jest.mock('@expo/app-integrity', () => ({
  get isSupported() {
    return mockDevice.isSupported;
  },
  generateKeyAsync: jest.fn(),
  attestKeyAsync: jest.fn(),
  generateAssertionAsync: jest.fn(),
}));

const generateKey = jest.mocked(generateKeyAsync);
const attestKey = jest.mocked(attestKeyAsync);
const assert = jest.mocked(generateAssertionAsync);

const memoryStore = (initial: Record<string, string> = {}): KeyValueStoreInterface & { values: Map<string, string> } => {
  const values = new Map(Object.entries(initial));
  return {
    values,
    getItem: (key) => Promise.resolve(ok(values.get(key) ?? null)),
    setItem: (key, value) => Promise.resolve(ok(void values.set(key, value))),
    removeItem: (key) => Promise.resolve(ok(void values.delete(key))),
  };
};

const repository = (registered: Result<unknown, Failure> = ok({})) => {
  const repo = {
    fetchChallenge: jest.fn().mockResolvedValue(ok('challenge-1')),
    registerAppleKey: jest.fn().mockResolvedValue(registered),
  };
  return repo as typeof repo & AttestationRepository;
};

describe('AppAttestAttestor', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockDevice.isSupported = true;
    generateKey.mockResolvedValue('key-1');
    attestKey.mockResolvedValue('attestation-1');
    assert.mockResolvedValue('assertion');
  });

  it('attests and registers a key once, then signs every request with it', async () => {
    const store = memoryStore();
    const repo = repository();
    const attestor = new AppAttestAttestor(store, repo);

    const first = await attestor.headersFor('POST /recipes/generate\nrid-1');
    await attestor.headersFor('POST /recipes/generate\nrid-2');

    expect(attestKey).toHaveBeenCalledWith('key-1', 'challenge-1');
    expect(repo.registerAppleKey).toHaveBeenCalledTimes(1);
    expect(repo.registerAppleKey).toHaveBeenCalledWith({ keyId: 'key-1', attestation: 'attestation-1', challenge: 'challenge-1' });
    expect(store.values.get(APP_ATTEST_KEY_STORAGE_KEY)).toBe('key-1');
    expect(assert).toHaveBeenCalledWith('key-1', 'POST /recipes/generate\nrid-1');
    expect(first).toEqual({
      'X-App-Attestation-Platform': 'ios',
      'X-App-Attestation-Key': 'key-1',
      'X-App-Attestation': 'assertion',
    });
  });

  it('reuses the key a previous launch registered', async () => {
    const repo = repository();
    const attestor = new AppAttestAttestor(memoryStore({ [APP_ATTEST_KEY_STORAGE_KEY]: 'stored-key' }), repo);

    await attestor.headersFor('b');

    expect(repo.fetchChallenge).not.toHaveBeenCalled();
    expect(assert).toHaveBeenCalledWith('stored-key', 'b');
  });

  it('keeps no key the backend refused, and tries again on the next request', async () => {
    const store = memoryStore();
    const repo = repository(fail(new NetworkFailure('offline')));
    const attestor = new AppAttestAttestor(store, repo);

    expect(await attestor.headersFor('b')).toBeNull();
    expect(store.values.has(APP_ATTEST_KEY_STORAGE_KEY)).toBe(false);
    await attestor.headersFor('b');
    expect(repo.fetchChallenge).toHaveBeenCalledTimes(2);
  });

  it('registers one key when requests race at start-up', async () => {
    const repo = repository();
    const attestor = new AppAttestAttestor(memoryStore(), repo);

    await Promise.all([attestor.headersFor('a'), attestor.headersFor('b')]);

    expect(generateKey).toHaveBeenCalledTimes(1);
  });

  it('forgets a key the Secure Enclave no longer holds, so the next request registers a new one', async () => {
    const store = memoryStore({ [APP_ATTEST_KEY_STORAGE_KEY]: 'restored-key' });
    assert.mockRejectedValueOnce(Object.assign(new Error('gone'), { code: 'ERR_APP_INTEGRITY_INVALID_KEY' }));
    const attestor = new AppAttestAttestor(store, repository());

    expect(await attestor.headersFor('b')).toBeNull();
    expect(store.values.has(APP_ATTEST_KEY_STORAGE_KEY)).toBe(false);
    await attestor.headersFor('b');
    expect(assert).toHaveBeenLastCalledWith('key-1', 'b');
  });

  it('sends no proof on a device without App Attest', async () => {
    mockDevice.isSupported = false;
    const repo = repository();

    expect(await new AppAttestAttestor(memoryStore(), repo).headersFor('b')).toBeNull();
    expect(repo.fetchChallenge).not.toHaveBeenCalled();
  });
});
