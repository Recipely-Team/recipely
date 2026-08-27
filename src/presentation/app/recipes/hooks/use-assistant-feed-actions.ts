import { AssistantActionError } from '@domain/assistant/actions/assistant-action-error';
import { machineLower, machineUpper } from '@presentation/base/hooks/assistant/args/machine-case';
import { foldForMatch } from '@presentation/base/hooks/assistant/args/fold-for-match';
import type { TaxonomyItem } from '@domain/recipes/taxonomy/taxonomy-item';
import { useStores } from '@presentation/bootstrap/use-stores';
import { parseKeyValue } from '@presentation/base/hooks/assistant/args/parse-key-value';
import { useCallback } from 'react';
import { AssistantAction } from '@domain/assistant/actions/assistant-action-type';
import type { AssistantActionResultType } from '@domain/assistant/actions/assistant-action-result';
import { Difficulty } from '@domain/recipes/difficulty';
import { SortKey } from '@presentation/app/recipes/model/sorting/sort-key';
import type { UiFilters } from '@presentation/app/recipes/model/filtering/ui-filters';
import { useAssistantAction } from '@presentation/base/hooks/assistant/actions/use-assistant-action';
import { CharConstants, ValueConstants } from '@core/constants';

/** The feed capability the assistant borrows, named where it is consumed. */
interface AssistantFeedActionsDeps {
  filters: UiFilters;
  onToggleCuisineQuick: (cuisine: string) => void;
  onToggleCategory: (category: string) => void;
  onDifficultyChange: (difficulty: Difficulty | null) => void;
  onSetMaxTime: (minutes: number) => void;
  onRemoveCategory: (category: string) => void;
  onRemoveDifficulty: (difficulty: Difficulty) => void;
  onRemoveMaxTime: () => void;
  onClearSearch: () => void;
  onClearAllFilters: () => void;
  onChangeSort: (key: SortKey) => void;
}

const CUISINE = 'cuisine';
const CATEGORY = 'category';
const DIFFICULTY = 'difficulty';
const MAX_TIME = 'maxTime';
/**
 * The search box, which narrows the feed exactly as a filter does.
 *
 * A user looking at three results does not classify what is doing the
 * narrowing; they say "clear it". Leaving the query out made "clear the
 * filters" answer `ok` with the feed unchanged.
 */
const SEARCH = 'search';

/**
 * Filtering and sorting the feed, by voice.
 *
 * @remarks
 * - **One argument, so the kind is named in it.** The tool has a single string,
 *   and "add Italian" is ambiguous between a cuisine and a category — so the
 *   model says `cuisine=italian`. Guessing from the value would need a taxonomy
 *   the model does not have and would silently filter on the wrong axis.
 * - **Adding and removing are separate words**, because they are separate
 *   requests. A single `toggle` would have made "add Italian" turn Italian OFF
 *   whenever it was already on, which is the opposite of what was asked.
 * - **Values pass through as the backend's own keys.** Cuisines and categories
 *   are opaque taxonomy strings the backend owns; translating them here would
 *   need a table that goes stale every time the backend adds one.
 */
export const useAssistantFeedActions = (deps: AssistantFeedActionsDeps): void => {
  const { taxonomyStore } = useStores();
  const cuisineOptions = taxonomyStore((state) => state.cuisines);
  const categoryOptions = taxonomyStore((state) => state.categories);

  const {
    filters,
    onToggleCuisineQuick,
    onToggleCategory,
    onDifficultyChange,
    onSetMaxTime,
    onRemoveCategory,
    onRemoveDifficulty,
    onRemoveMaxTime,
    onClearSearch,
    onClearAllFilters,
    onChangeSort,
  } = deps;

  useAssistantAction(
    AssistantAction.AddFilter,
    useCallback(
      async (arg?: string): Promise<AssistantActionResultType> => {
        const parsed = parseKeyValue(arg);
        if (parsed === null) return { ok: false, error: 'expected_kind_equals_value' };

        switch (parsed.key) {
          case CUISINE: {
            // The model says "Italian"; the feed filters on the backend's key.
            // Passing the word through produced a filter that matched nothing,
            // an empty feed, and `ok: true` reported to the model.
            const key = resolveKey(cuisineOptions, parsed.value);
            if (key === null) return { ok: false, error: taxonomyError(cuisineOptions, CUISINE) };
            if (filters.cuisines.includes(key)) return { ok: true, n: filterCounts(filters) };
            onToggleCuisineQuick(key);
            return { ok: true, n: filterCounts(filters, CUISINE, ValueConstants.one) };
          }
          case CATEGORY: {
            const key = resolveKey(categoryOptions, parsed.value);
            if (key === null) return { ok: false, error: taxonomyError(categoryOptions, CATEGORY) };
            if (filters.categories.includes(key)) return { ok: true, n: filterCounts(filters) };
            onToggleCategory(key);
            return { ok: true, n: filterCounts(filters, CATEGORY, ValueConstants.one) };
          }
          case DIFFICULTY: {
            const difficulty = asDifficulty(parsed.value);
            if (difficulty === null) return { ok: false, error: 'unknown_difficulty' };
            onDifficultyChange(difficulty);
            return { ok: true, n: filterCounts(filters) };
          }
          case MAX_TIME: {
            const minutes = Number.parseInt(parsed.value, 10);
            if (!Number.isFinite(minutes)) return { ok: false, error: 'not_a_number' };
            onSetMaxTime(minutes);
            return { ok: true, n: filterCounts(filters) };
          }
          default:
            return { ok: false, error: 'unknown_filter' };
        }
      },
      [filters, onToggleCuisineQuick, onToggleCategory, onDifficultyChange, onSetMaxTime, cuisineOptions, categoryOptions],
    ),
  );

  useAssistantAction(
    AssistantAction.RemoveFilter,
    useCallback(
      async (arg?: string): Promise<AssistantActionResultType> => {
        const parsed = parseKeyValue(arg);
        if (parsed === null) return { ok: false, error: 'expected_kind_equals_value' };

        switch (parsed.key) {
          case CUISINE: {
            const key = resolveKey(cuisineOptions, parsed.value);
            if (key === null) return { ok: false, error: taxonomyError(cuisineOptions, CUISINE) };
            if (!filters.cuisines.includes(key)) return { ok: false, error: 'not_applied' };
            // The quick toggle is what the chip row calls, so removing looks
            // exactly like the user tapping the chip off.
            onToggleCuisineQuick(key);
            return { ok: true, n: filterCounts(filters, CUISINE, ValueConstants.minusOne) };
          }
          case CATEGORY: {
            const key = resolveKey(categoryOptions, parsed.value);
            if (key === null) return { ok: false, error: taxonomyError(categoryOptions, CATEGORY) };
            onRemoveCategory(key);
            return { ok: true, n: filterCounts(filters, CATEGORY, ValueConstants.minusOne) };
          }
          case DIFFICULTY: {
            const difficulty = asDifficulty(parsed.value);
            if (difficulty === null) return { ok: false, error: 'unknown_difficulty' };
            onRemoveDifficulty(difficulty);
            return { ok: true, n: filterCounts(filters) };
          }
          case MAX_TIME:
            onRemoveMaxTime();
            return { ok: true, n: filterCounts(filters) };
          case SEARCH:
            // The value is ignored: there is one query box, so "remove the
            // search" is unambiguous however the model spells the subject.
            onClearSearch();
            return { ok: true, n: filterCounts(filters) };
          default:
            return { ok: false, error: 'unknown_filter' };
        }
      },
      [filters, onToggleCuisineQuick, onRemoveCategory, onRemoveDifficulty, onRemoveMaxTime, onClearSearch, cuisineOptions, categoryOptions],
    ),
  );

  useAssistantAction(
    AssistantAction.ClearFilters,
    useCallback(async (): Promise<AssistantActionResultType> => {
      // Unconditional, and it clears the query too. Both halves were bugs the
      // user watched: a count read from the previous render is zero for a
      // filter this same turn had just applied, so the clear was skipped and
      // reported done — and a feed narrowed only by a search was "cleared"
      // without anything moving at all.
      onClearAllFilters();
      return { ok: true, n: { filters: ValueConstants.zero } };
    }, [onClearAllFilters]),
  );

  useAssistantAction(
    AssistantAction.Sort,
    useCallback(
      async (arg?: string): Promise<AssistantActionResultType> => {
        const key = arg ?? CharConstants.empty;
        if (!isSortKey(key)) return { ok: false, error: 'unknown_sort' };
        onChangeSort(key);
        return { ok: true };
      },
      [onChangeSort],
    ),
  );
};


// The wire values are upper-case (`EASY`); a person says "easy". Matching
// case-insensitively is the difference between the filter applying and the
// model being told its own vocabulary is wrong.
function asDifficulty(value: string): Difficulty | null {
  const wanted = machineUpper(value);
  return Object.values(Difficulty).find((d) => d === wanted) ?? null;
}

function isSortKey(value: string): value is SortKey {
  return (Object.values(SortKey) as string[]).includes(value);
}

/**
 * How many filters are on, after a change of `delta` on `axis`.
 *
 * The counts are read from the filters this render closed over, which are the
 * ones from BEFORE the change just applied — reporting them raw told the model
 * the state it had a moment ago, and it would say "two cuisines" having just
 * added the third.
 */
function filterCounts(filters: UiFilters, axis?: string, delta = ValueConstants.zero): Record<string, number> {
  const counts: Record<string, number> = {
    cuisine: filters.cuisines.length,
    category: filters.categories.length,
    difficulty: filters.difficulties.length,
  };
  if (axis !== undefined && counts[axis] !== undefined) counts[axis] += delta;
  return counts;
}

/**
 * Matches a taxonomy entry by its key or by the name the screen shows.
 *
 * The two halves fold differently on purpose. A key is an ASCII machine
 * constant, so `machineLower` is right and folding it could collide two of
 * them. A name is text a person reads and says back, and folding it is what
 * lets "italyan" reach `İtalyan` — whose `toLowerCase()` carries a combining
 * dot and so matched nothing any user could pronounce.
 */
function resolveKey(options: readonly TaxonomyItem[], value: string): string | null {
  const wantedKey = machineLower(value);
  const wantedName = foldForMatch(value);
  const match = options.find(
    (item) => machineLower(item.key) === wantedKey || foldForMatch(item.name) === wantedName,
  );
  return match?.key ?? null;
}

/**
 * An empty catalogue is not an unrecognised value — the app has simply not
 * loaded it yet, and saying the cuisine does not exist would have the model
 * tell the user something untrue.
 */
function taxonomyError(options: readonly TaxonomyItem[], kind: string): string {
  return options.length === ValueConstants.zero
    ? AssistantActionError.NotReady
    : `unknown_${kind}`;
}
