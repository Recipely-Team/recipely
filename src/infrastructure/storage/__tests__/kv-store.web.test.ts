/**
 * Contract test for the web `kvStore`: the `.web` variant must satisfy the same
 * `IKeyValueStore` port over `localStorage`, round-tripping writes/reads and
 * returning `null` for absent keys. A minimal in-memory `localStorage` stands in
 * for the browser global (the jest environment is node, which has none).
 */
import type { IKeyValueStore } from '@domain/storage/i-key-value-store';
import { kvStore } from '@infrastructure/storage/kv-store.web';
import { ok } from '@core/result/result-helpers';

const mem = new Map<string, string>();

beforeAll(() => {
  (globalThis as { localStorage: Storage }).localStorage = {
    getItem: (key: string): string | null => (mem.has(key) ? (mem.get(key) as string) : null),
    setItem: (key: string, value: string): void => {
      mem.set(key, value);
    },
    removeItem: (key: string): void => {
      mem.delete(key);
    },
    clear: (): void => mem.clear(),
    key: (): string | null => null,
    length: 0,
  };
});

describe('kvStore (web)', () => {
  const webStore: IKeyValueStore = kvStore;

  beforeEach(() => {
    mem.clear();
  });

  it('returns null for a key that was never written', async () => {
    await expect(webStore.getItem('theme_id')).resolves.toEqual(ok(null));
  });

  it('round-trips a written value through localStorage', async () => {
    await webStore.setItem('theme_id', 'royal-purple');

    await expect(webStore.getItem('theme_id')).resolves.toEqual(ok('royal-purple'));
  });

  it('returns null again after the key is removed', async () => {
    await webStore.setItem('theme_id', 'royal-purple');

    await webStore.removeItem('theme_id');

    await expect(webStore.getItem('theme_id')).resolves.toEqual(ok(null));
  });
});
