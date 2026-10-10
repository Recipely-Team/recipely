import type { FridgeFilters } from '@presentation/app/fridge/model/filters/fridge-filters';

/** What the shown ideas were asked for — kept so "Show 3 more" and the picked idea's prompt match them. */
export interface FridgeIdeasQuery {
  readonly ingredients: readonly string[];
  readonly filters: FridgeFilters;
}
