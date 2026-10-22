import { fail, ok } from '@core/result/result-helpers';
import { NetworkFailure, UnauthorizedFailure } from '@core/failure';
import type { KeyValueStoreInterface } from '@domain/storage/key-value-store-interface';
import { FirstPageCache } from '@infrastructure/network/paging/first-page-cache';
import type { PageDto } from '@infrastructure/network/paging/page-dto';

const memoryStore = (): KeyValueStoreInterface => {
  const map = new Map<string, string>();
  return {
    getItem: (key) => Promise.resolve(ok(map.get(key) ?? null)),
    setItem: (key, value) => { map.set(key, value); return Promise.resolve(ok(undefined)); },
    removeItem: (key) => { map.delete(key); return Promise.resolve(ok(undefined)); },
  };
};

const page = (names: string[]): PageDto<{ name: string }> =>
  ({ items: names.map((name) => ({ name })), total: names.length, page: 1, pageSize: 20 }) as PageDto<{ name: string }>;

describe('FirstPageCache', () => {
  it('opens a list offline on the first page it showed last time', async () => {
    const cache = new FirstPageCache<{ name: string }>(memoryStore(), 'slot');
    await cache.readThrough('q', true, ok(page(['milk', 'eggs'])));
    await new Promise((resolve) => setImmediate(resolve));

    const offline = await cache.readThrough('q', true, fail(new NetworkFailure('no signal')));

    expect(offline.ok && offline.value.items.map((i) => i.name)).toEqual(['milk', 'eggs']);
  });

  it('never answers a refusal from the cache: a 401 is a 401', async () => {
    const cache = new FirstPageCache<{ name: string }>(memoryStore(), 'slot');
    await cache.save('q', page(['milk']));

    const refused = await cache.readThrough('q', true, fail(new UnauthorizedFailure('expired')));

    expect(refused.ok).toBe(false);
  });

  it('serves only the first page, and only for the same query', async () => {
    const cache = new FirstPageCache<{ name: string }>(memoryStore(), 'slot');
    await cache.save('q', page(['milk']));

    expect((await cache.readThrough('q', false, fail(new NetworkFailure('x')))).ok).toBe(false);
    expect((await cache.readThrough('other', true, fail(new NetworkFailure('x')))).ok).toBe(false);
  });
});
