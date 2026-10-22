import type { KeyValueStoreInterface } from '@domain/storage/key-value-store-interface';
import { isObject } from '@core/guards/type-guards';
import { ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { PageDto } from '@infrastructure/network/paging/page-dto';
import { isUnreachableFailure } from '@infrastructure/network/errors/is-unreachable-failure';

/** What one slot holds: the query it answered, and the answer as the API sent it. */
interface StoredFirstPage<TDto> {
  readonly query: string;
  readonly page: PageDto<TDto>;
}

/**
 * One storage slot holding the last first page of a list, as raw DTOs, so a
 * list that cannot reach the API opens on what it showed last time instead of
 * an error. Used by the recipe feed, the shopping list and saved recipes.
 *
 * @remarks
 * - **Only a first page, only the same query.** The slot is keyed by the
 *   serialised query; a filtered or later page never reads it.
 * - **Only when the API was unreachable.** A timeout or a dropped connection
 *   falls back to it, never an answer the API gave (a 401 must not show a
 *   cached list).
 * - **User-scoped slots are wiped at sign-out** (`USER_SCOPED_STORAGE_KEYS`),
 *   so the next account offline never sees the last one's list.
 * - **Best effort.** A storage failure is ignored: the cache is a cushion,
 *   not a source of truth.
 */
export class FirstPageCache<TDto> {
  constructor(
    private readonly store: KeyValueStoreInterface,
    private readonly storageKey: string,
  ) {}

  /** Saves a first page that arrived, or answers a first page that could not, from the slot. */
  async readThrough(
    query: string,
    isFirstPage: boolean,
    result: Result<PageDto<TDto>, Failure>,
  ): Promise<Result<PageDto<TDto>, Failure>> {
    if (!isFirstPage) return result;
    if (result.ok) {
      void this.save(query, result.value);
      return result;
    }
    if (!isUnreachableFailure(result.failure)) return result;
    const cached = await this.load(query);
    return cached === null ? result : ok(cached);
  }

  async save(query: string, page: PageDto<TDto>): Promise<void> {
    await this.store.setItem(this.storageKey, JSON.stringify({ query, page } satisfies StoredFirstPage<TDto>));
  }

  async load(query: string): Promise<PageDto<TDto> | null> {
    const read = await this.store.getItem(this.storageKey);
    if (!read.ok || read.value === null) return null;
    try {
      const stored: unknown = JSON.parse(read.value);
      return isObject(stored) && stored.query === query && isObject(stored.page) ? (stored.page as unknown as PageDto<TDto>) : null;
    } catch {
      return null;
    }
  }
}
