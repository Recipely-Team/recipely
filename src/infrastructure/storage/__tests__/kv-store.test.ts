/**
 * Moving caches and preferences from SecureStore to MMKV must not reset anyone: an update
 * that lost the saved language, the onboarding flag or the offline shopping outbox would be
 * a regression users notice at once. A key MMKV lacks is read from SecureStore, kept, and
 * deleted there. MMKV runs as its own in-memory mock under jest.
 */
/* eslint-disable import/first -- jest.mock() must be hoisted above imports */

const mockSecure = new Map<string, string>();

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn((key: string): Promise<string | null> => Promise.resolve(mockSecure.get(key) ?? null)),
  setItemAsync: jest.fn((key: string, value: string): Promise<void> => {
    mockSecure.set(key, value);
    return Promise.resolve();
  }),
  deleteItemAsync: jest.fn((key: string): Promise<void> => {
    mockSecure.delete(key);
    return Promise.resolve();
  }),
}));

import { kvStore } from '@infrastructure/storage/kv-store';
import { ok } from '@core/result/result-helpers';

describe('kvStore (native, MMKV)', () => {
  beforeEach(() => mockSecure.clear());

  it('round-trips a value without touching SecureStore', async () => {
    await kvStore.setItem('k.round', 'v');
    expect(await kvStore.getItem('k.round')).toEqual(ok('v'));
    expect(mockSecure.has('k.round')).toBe(false);
  });

  it('moves a value an earlier version kept in SecureStore on its first read', async () => {
    mockSecure.set('recipely.language.v1', 'tr');

    expect(await kvStore.getItem('recipely.language.v1')).toEqual(ok('tr'));
    expect(mockSecure.has('recipely.language.v1')).toBe(false);
    expect(await kvStore.getItem('recipely.language.v1')).toEqual(ok('tr'));
  });

  it('answers null for a key held nowhere, and a removal clears both stores', async () => {
    expect(await kvStore.getItem('k.none')).toEqual(ok(null));
    mockSecure.set('k.old', 'x');
    await kvStore.removeItem('k.old');
    expect(await kvStore.getItem('k.old')).toEqual(ok(null));
  });
});
