/**
 * Contract test for the native `kvStore`: it must satisfy the `IKeyValueStore`
 * port by delegating to `expo-secure-store` and round-tripping writes/reads,
 * returning `null` for absent keys. The platform module is replaced with an
 * in-memory backing because the jest-expo `expo-secure-store` mock does not
 * persist — this exercises the delegation contract, never a real device store.
 */
/* eslint-disable import/first -- jest.mock() must be hoisted above imports */

const mockBacking = new Map<string, string>();

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn((key: string): Promise<string | null> =>
    Promise.resolve(mockBacking.has(key) ? (mockBacking.get(key) as string) : null)),
  setItemAsync: jest.fn((key: string, value: string): Promise<void> => {
    mockBacking.set(key, value);
    return Promise.resolve();
  }),
  deleteItemAsync: jest.fn((key: string): Promise<void> => {
    mockBacking.delete(key);
    return Promise.resolve();
  }),
}));

import { kvStore } from '@infrastructure/storage/kv-store';
import { ok } from '@core/result/result-helpers';

describe('kvStore (native)', () => {
  beforeEach(() => {
    mockBacking.clear();
    jest.clearAllMocks();
  });

  it('returns null for a key that was never written', async () => {
    await expect(kvStore.getItem('session')).resolves.toEqual(ok(null));
  });

  it('round-trips a written value through the secure store', async () => {
    await kvStore.setItem('session', 'token-123');

    await expect(kvStore.getItem('session')).resolves.toEqual(ok('token-123'));
  });

  it('returns null again after the key is removed', async () => {
    await kvStore.setItem('session', 'token-123');

    await kvStore.removeItem('session');

    await expect(kvStore.getItem('session')).resolves.toEqual(ok(null));
  });
});
