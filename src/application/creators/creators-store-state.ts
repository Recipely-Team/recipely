import type { CreatorSummaryEntity } from '@domain/creators/creator-summary-entity';
import type { CreatorsListState } from '@application/creators/list/creators-list-state';

export interface CreatorsStoreState {
  /** The strip's items, most-followed first. Empty means the strip is hidden. */
  creators: CreatorSummaryEntity[];
  listState: CreatorsListState;
  /** First load. A no-op while a load is in flight or once the strip is loaded. */
  load: () => Promise<void>;
  /** Re-reads the first page; the rows on screen stay until the answer lands. */
  refresh: () => Promise<void>;
  /** Appends the next page when there is one; failures keep the rows already shown. */
  loadMore: () => Promise<void>;
}
