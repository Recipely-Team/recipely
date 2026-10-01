import type { Failure } from '@core/failure';
import type { Result } from '@core/result/result';
import type { Page } from '@domain/common/page';
import type { PageDto } from '@infrastructure/network/paging/page-dto';

/**
 * Any `PageResult` envelope → `Page<T>`, mapping each item with `mapItem`.
 *
 * @remarks
 * - **An unreadable item is skipped, not fatal** — one odd row must not empty
 *   a list.
 * - **`hasMore` is `page * pageSize < total`**, the backend's own counts, so a
 *   skipped row cannot make the list look finished.
 */
export const toPage = <D, T>(dto: PageDto<D>, mapItem: (item: D) => Result<T, Failure>): Page<T> => {
  const items: T[] = [];
  for (const item of dto.items) {
    const mapped = mapItem(item);
    if (mapped.ok) items.push(mapped.value);
  }
  return {
    items,
    total: dto.total,
    page: dto.page,
    pageSize: dto.pageSize,
    hasMore: dto.page * dto.pageSize < dto.total,
  };
};
