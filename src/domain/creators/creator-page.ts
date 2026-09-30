import type { CreatorSummaryEntity } from '@domain/creators/creator-summary-entity';

/** One page of the creators list, with enough context to ask for the next. */
export interface CreatorPage {
  items: CreatorSummaryEntity[];
  /** Every listed creator across all pages, as the backend counts them. */
  total: number;
  /** 1-based, matching the API. */
  page: number;
  pageSize: number;
  /** True while pages remain after this one. */
  hasMore: boolean;
}
