import type { CreatorSummaryEntity } from '@domain/creators/creator-summary-entity';

/** View model returned by {@link useCreatorsStrip} for the Explore creators strip. */
export interface UseCreatorsStripResult {
  creators: readonly CreatorSummaryEntity[];
  /** False while nothing has loaded, when the list is empty, and when it failed: the strip is not drawn. */
  isVisible: boolean;
  onOpenCreator: (id: string) => void;
  onOpenAll: () => void;
  /** Asks for the next page as the strip scrolls sideways. */
  onEndReached: () => void;
}
