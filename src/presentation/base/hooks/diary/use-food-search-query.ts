import { useEffect } from 'react';
import { CharConstants, ValueConstants } from '@core/constants';
import { useStores } from '@presentation/bootstrap/use-stores';
import { useDebouncedValue } from '@presentation/base/hooks/interaction/use-debounced-value';
import { ADD_FOOD_SEARCH_DEBOUNCE_MS } from '@presentation/base/widgets/diary/add-food/list/search-debounce';

/**
 * Drives the food search from the pick step's box: 300 ms after the last
 * keystroke (Add food v2 spec §3), and at once when the box is cleared, so
 * the Recipes tab never waits behind a dropped query. Mounted only where the
 * results show (a query, or the Recipes tab). Runs on open too —
 * the lists are always fresh, so a recipe created a minute ago is there.
 */
export const useFoodSearchQuery = (query: string): void => {
  const { foodSearchStore } = useStores();
  const trimmed = query.trim();
  const debounced = useDebouncedValue(trimmed, ADD_FOOD_SEARCH_DEBOUNCE_MS);
  // Until the debounce has caught up, an earlier query ("a" while "ab" is typed) is not sent.
  const effective = trimmed.length === ValueConstants.zero ? CharConstants.empty : debounced === trimmed ? trimmed : null;
  useEffect(() => {
    if (effective !== null) void foodSearchStore.getState().search(effective);
  }, [effective, foodSearchStore]);
};
