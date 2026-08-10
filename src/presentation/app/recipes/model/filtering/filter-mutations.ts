import type { UiFilters } from '@presentation/app/recipes/model/filtering/ui-filters';
import { ALL_CUISINES_KEY } from '@presentation/app/recipes/model/filtering/cuisine-filter';
import type { Difficulty } from '@domain/recipes/difficulty';
import { ValueConstants } from '@core/constants';

/** Toggles a cuisine key in a filters set (adds if absent, removes if present). */
export const toggleCuisine = (f: UiFilters, cuisine: string): UiFilters => ({
  ...f,
  cuisines: f.cuisines.includes(cuisine)
    ? f.cuisines.filter((x) => x !== cuisine)
    : [...f.cuisines, cuisine],
});

/** Toggles a category key in a filters set. */
export const toggleCategory = (f: UiFilters, category: string): UiFilters => ({
  ...f,
  categories: f.categories.includes(category)
    ? f.categories.filter((x) => x !== category)
    : [...f.categories, category],
});

/** Toggles a difficulty in a filters set. */
export const toggleDifficulty = (f: UiFilters, difficulty: Difficulty): UiFilters => ({
  ...f,
  difficulties: f.difficulties.includes(difficulty)
    ? f.difficulties.filter((x) => x !== difficulty)
    : [...f.difficulties, difficulty],
});

/** Sets the max-time filter (0 clears it). */
export const setMaxTime = (f: UiFilters, minutes: number): UiFilters => ({ ...f, maxTime: minutes });

/** Removes a single category from a filters set. */
export const removeCategory = (f: UiFilters, category: string): UiFilters => ({
  ...f,
  categories: f.categories.filter((x) => x !== category),
});

/** Removes a single difficulty from a filters set. */
export const removeDifficulty = (f: UiFilters, difficulty: Difficulty): UiFilters => ({
  ...f,
  difficulties: f.difficulties.filter((x) => x !== difficulty),
});

/** Clears the max-time filter. */
export const removeMaxTime = (f: UiFilters): UiFilters => ({ ...f, maxTime: ValueConstants.zero });

/**
 * Quick-toggles a cuisine from the web cuisine grid: the 'ALL' sentinel clears
 * the cuisine filter, any real key toggles as usual.
 */
export const toggleCuisineQuick = (f: UiFilters, cuisine: string): UiFilters => ({
  ...f,
  cuisines:
    cuisine === ALL_CUISINES_KEY
      ? []
      : f.cuisines.includes(cuisine)
        ? f.cuisines.filter((x) => x !== cuisine)
        : [...f.cuisines, cuisine],
});

/** Web single-select difficulty: replaces the difficulty set (`null` clears it). */
export const setDifficultyQuick = (f: UiFilters, difficulty: Difficulty | null): UiFilters => ({
  ...f,
  difficulties: difficulty ? [difficulty] : [],
});

/** Sum of applied filters, used for the active-filter badge/count. */
export const countActiveFilters = (f: UiFilters): number =>
  f.cuisines.length + f.categories.length + f.difficulties.length + (f.maxTime > ValueConstants.zero ? 1 : ValueConstants.zero);
