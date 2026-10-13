import type { KeyValueStoreInterface } from '@domain/storage/key-value-store-interface';
import { FEED_FIRST_PAGE_STORAGE_KEY } from '@infrastructure/constants/storage';
import { isObject } from '@core/guards/type-guards';
import type { PageDto } from '@infrastructure/network/paging/page-dto';
import type { RecipeListItemDto } from '@infrastructure/recipes/dtos/recipe-list-item-dto';

/** What one slot holds: the query it answered, and the answer as the API sent it. */
interface StoredFirstPage {
  readonly query: string;
  readonly page: PageDto<RecipeListItemDto>;
}

/**
 * One slot holding the last first page of the recipe feed, as raw DTOs, so a
 * feed that cannot reach the API opens on the recipes it showed last time
 * instead of an error.
 *
 * @remarks
 * - **Only a first page, only the same query.** The slot is keyed by the
 *   serialised query; a filtered or later page never reads it.
 * - **Only when the API was unreachable.** The repository falls back to it on
 *   a timeout or a dropped connection, never on an answer the API gave.
 * - **Best effort.** A storage failure is ignored: the cache is a cushion,
 *   not a source of truth.
 */
export class FeedFirstPageCache {
  constructor(private readonly store: KeyValueStoreInterface) {}

  async save(query: string, page: PageDto<RecipeListItemDto>): Promise<void> {
    await this.store.setItem(FEED_FIRST_PAGE_STORAGE_KEY, JSON.stringify({ query, page } satisfies StoredFirstPage));
  }

  async load(query: string): Promise<PageDto<RecipeListItemDto> | null> {
    const read = await this.store.getItem(FEED_FIRST_PAGE_STORAGE_KEY);
    if (!read.ok || read.value === null) return null;
    try {
      const stored: unknown = JSON.parse(read.value);
      return isObject(stored) && stored.query === query && isObject(stored.page) ? (stored.page as unknown as PageDto<RecipeListItemDto>) : null;
    } catch {
      return null;
    }
  }
}
