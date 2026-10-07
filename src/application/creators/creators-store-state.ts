import type { CreatorSummaryEntity } from '@domain/creators/creator-summary-entity';
import type { PagedList } from '@application/store/paging/paged-list';

export interface CreatorsStoreState {
  /** The strip, most-followed first. Loaded and empty means the strip is hidden. */
  creators: PagedList<CreatorSummaryEntity>;
  /** First load. A no-op while a load is in flight or once the strip is loaded. */
  load: () => Promise<void>;
  /** Re-reads the first page; the rows on screen stay until the answer lands. */
  refresh: () => Promise<void>;
  /** Appends the next page when there is one; failures keep the rows already shown. */
  loadMore: () => Promise<void>;
}
