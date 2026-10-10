import { FridgeDiet } from '@domain/fridge/ideas/fridge-diet';
import { FridgeLimits } from '@domain/fridge/fridge-limits';
import type { FridgeFilters } from '@presentation/app/fridge/model/filters/fridge-filters';

/** No time cap, no diet, two servings — what "Clear filters" returns to. */
export const DEFAULT_FRIDGE_FILTERS: FridgeFilters = {
  maxMinutes: null,
  diet: FridgeDiet.None,
  servings: FridgeLimits.servingsDefault,
};
