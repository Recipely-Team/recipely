import { useEffect, useRef, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useDebouncedValue } from '@presentation/base/hooks/interaction/use-debounced-value';
import { useWebShellState } from '@presentation/base/web-shell/use-web-shell-state';
import { SEARCH_DEBOUNCE_MS } from '@presentation/app/recipes/model/search-debounce';
import { CharConstants, ValueConstants } from '@core/constants';

/**
 * The feed's search text: what is typed, what is trimmed, what is asked for.
 *
 * @remarks
 * - **Two fields, one query.** The web shell types into the shared app-header
 *   field, a phone into the feed's own; whichever the shell shows is the query.
 * - **The assistant searches through `?q=`** so the words appear in the field;
 *   each distinct query is applied once, to both fields.
 * - **Requests follow the debounced text**, the screen's spinner the trimmed
 *   one, so typing shows "searching" at once and asks once.
 */
export const useFeedSearch = (isWebShell: boolean) => {
  const { searchQuery: webSearchQuery, setSearchQuery: setWebSearchQuery } = useWebShellState();
  const [search, setSearch] = useState(CharConstants.empty);

  const { q: queryParam } = useLocalSearchParams<{ q?: string }>();
  const appliedQuery = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (queryParam === undefined || queryParam === appliedQuery.current) return;
    appliedQuery.current = queryParam;
    setSearch(queryParam);
    setWebSearchQuery(queryParam);
  }, [queryParam, setWebSearchQuery]);

  const trimmedSearch = (isWebShell ? webSearchQuery : search).trim();
  const debouncedSearch = useDebouncedValue(trimmedSearch, SEARCH_DEBOUNCE_MS);

  return {
    search,
    setSearch,
    trimmedSearch,
    debouncedSearch,
    isSearching: trimmedSearch.length > ValueConstants.zero,
    clearSearch: (): void => {
      setSearch(CharConstants.empty);
      setWebSearchQuery(CharConstants.empty);
    },
  };
};
