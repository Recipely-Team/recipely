import type { UiFilters } from '@presentation/app/recipes/model/filtering/ui-filters';
import { ValueConstants } from '@core/constants';

/** An empty {@link UiFilters} selection (nothing applied). */
export const emptyFilters: UiFilters = {
  cuisines: [],
  categories: [],
  difficulties: [],
  maxTime: ValueConstants.zero,
};

/** Max total-time chip options (minutes); `0` means "any". */
export const TIME_OPTIONS: readonly number[] = [0, 15, 30, 45, 60, 90];
