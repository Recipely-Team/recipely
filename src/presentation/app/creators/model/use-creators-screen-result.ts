import type { CreatorSummaryEntity } from '@domain/creators/creator-summary-entity';
import type { PagedList } from '@application/store/paging/paged-list';

/** View model returned by {@link useCreatorsScreen} for the /creators page. */
export interface UseCreatorsScreenResult {
  creators: readonly CreatorSummaryEntity[];
  listState: PagedList<CreatorSummaryEntity>;
  columns: number;
  /** Between cards, both ways. */
  gap: number;
  isPullRefreshing: boolean;
  isLoadingMore: boolean;
  onRefresh: () => void;
  onEndReached: () => void;
  onOpenCreator: (address: string) => void;
  /** Opens Edit profile at Creator account — the placeholder's call to action. */
  onApplyAsCreator: () => void;
}
