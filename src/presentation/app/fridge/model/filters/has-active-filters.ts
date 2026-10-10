import type { FridgeFilters } from '@presentation/app/fridge/model/filters/fridge-filters';
import { DEFAULT_FRIDGE_FILTERS } from '@presentation/app/fridge/model/filters/default-fridge-filters';

/** Whether a time cap or a diet narrows the ideas — servings never leave an idea out. */
export const hasActiveFilters = (filters: FridgeFilters): boolean =>
  filters.maxMinutes !== DEFAULT_FRIDGE_FILTERS.maxMinutes || filters.diet !== DEFAULT_FRIDGE_FILTERS.diet;
