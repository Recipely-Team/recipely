import type { CreatorSummaryEntity } from '@domain/creators/creator-summary-entity';
import type { CreatorsListState } from '@application/creators/list/creators-list-state';

/** View model returned by {@link useCreatorsScreen} for the /creators page. */
export interface UseCreatorsScreenResult {
  creators: readonly CreatorSummaryEntity[];
  listState: CreatorsListState;
  columns: number;
  /** Between cards, both ways. */
  gap: number;
  /** One card's width, so a short last row keeps the grid's columns. */
  cellWidth: number;
  isPullRefreshing: boolean;
  isLoadingMore: boolean;
  onRefresh: () => void;
  onEndReached: () => void;
  onOpenCreator: (id: string) => void;
}
