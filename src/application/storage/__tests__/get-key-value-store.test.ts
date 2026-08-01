/**
 * `getKeyValueStore` accessor tests: it must return the container-registered
 * store when the composition root wired one, and fall back to the inert no-op
 * store (never throw) when nothing is registered — the DI-less unit-test mount.
 */
import { container } from '@core/di/container';
import { TOKENS } from '@application/di/tokens';
import { getKeyValueStore } from '@application/storage/get-key-value-store';
import { noopKeyValueStore } from '@application/storage/noop-key-value-store';
import { FakeKeyValueStore } from '@application/__fixtures__/fake-key-value-store';
import { ok } from '@core/result/result-helpers';

describe('getKeyValueStore', () => {
  beforeEach(() => {
    container.reset();
  });

  it('returns the container-registered store when one is registered', () => {
    const fake = new FakeKeyValueStore();
    container.register(TOKENS.KeyValueStore, () => fake);

    const resolved = getKeyValueStore();

    expect(resolved).toBe(fake);
  });

  it('returns the no-op store when the container has no registration', () => {
    expect(container.has(TOKENS.KeyValueStore)).toBe(false);

    const resolved = getKeyValueStore();

    expect(resolved).toBe(noopKeyValueStore);
  });

  it('falls back to a store whose reads are null and writes are silently dropped', async () => {
    const store = getKeyValueStore();

    await store.setItem('theme_id', 'royal-purple');

    await expect(store.getItem('theme_id')).resolves.toEqual(ok(null));
    await expect(store.removeItem('theme_id')).resolves.toEqual(ok(undefined));
  });
});
