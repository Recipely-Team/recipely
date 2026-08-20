import { useCallback } from 'react';
import { AssistantAction } from '@domain/assistant/actions/assistant-action-type';
import type { AssistantActionResultType } from '@domain/assistant/actions/assistant-action-result';
import { Difficulty } from '@domain/recipes/difficulty';
import { SortKey } from '@presentation/app/recipes/model/sorting/sort-key';
import type { UiFilters } from '@presentation/app/recipes/model/filtering/ui-filters';
import { useAssistantAction } from '@presentation/base/hooks/assistant/use-assistant-action';
import { CharConstants, ValueConstants } from '@core/constants';

/** The feed capability the assistant borrows, named where it is consumed. */
interface AssistantFeedActionsDeps {
  filters: UiFilters;
  activeFilterCount: number;
  onToggleCuisineQuick: (cuisine: string) => void;
  onToggleCategory: (category: string) => void;
  onDifficultyChange: (difficulty: Difficulty | null) => void;
  onSetMaxTime: (minutes: number) => void;
  onRemoveCategory: (category: string) => void;
  onRemoveDifficulty: (difficulty: Difficulty) => void;
  onRemoveMaxTime: () => void;
  onResetFilters: () => void;
  onChangeSort: (key: SortKey) => void;
}

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
const FIELD_SEPARATOR = '=';
const CUISINE = 'cuisine';
const CATEGORY = 'category';
const DIFFICULTY = 'difficulty';
const MAX_TIME = 'maxTime';

export const useAssistantFeedActions = (deps: AssistantFeedActionsDeps): void => {
  const {
    filters,
    activeFilterCount,
    onToggleCuisineQuick,
    onToggleCategory,
    onDifficultyChange,
    onSetMaxTime,
    onRemoveCategory,
    onRemoveDifficulty,
    onRemoveMaxTime,
    onResetFilters,
    onChangeSort,
  } = deps;

  useAssistantAction(
    AssistantAction.AddFilter,
    useCallback(
      async (arg?: string): Promise<AssistantActionResultType> => {
        const parsed = parseFilter(arg);
        if (parsed === null) return { ok: false, error: 'expected_kind_equals_value' };

        switch (parsed.kind) {
          case CUISINE:
            if (filters.cuisines.includes(parsed.value)) return { ok: true, n: filterCounts(filters) };
            onToggleCuisineQuick(parsed.value);
            return { ok: true, n: filterCounts(filters) };
          case CATEGORY:
            if (filters.categories.includes(parsed.value)) return { ok: true, n: filterCounts(filters) };
            onToggleCategory(parsed.value);
            return { ok: true, n: filterCounts(filters) };
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
      [filters, onToggleCuisineQuick, onToggleCategory, onDifficultyChange, onSetMaxTime],
    ),
  );

  useAssistantAction(
    AssistantAction.RemoveFilter,
    useCallback(
      async (arg?: string): Promise<AssistantActionResultType> => {
        const parsed = parseFilter(arg);
        if (parsed === null) return { ok: false, error: 'expected_kind_equals_value' };

        switch (parsed.kind) {
          case CUISINE:
            if (!filters.cuisines.includes(parsed.value)) return { ok: false, error: 'not_applied' };
            // The quick toggle is what the chip row calls, so removing looks
            // exactly like the user tapping the chip off.
            onToggleCuisineQuick(parsed.value);
            return { ok: true, n: filterCounts(filters) };
          case CATEGORY:
            onRemoveCategory(parsed.value);
            return { ok: true, n: filterCounts(filters) };
          case DIFFICULTY: {
            const difficulty = asDifficulty(parsed.value);
            if (difficulty === null) return { ok: false, error: 'unknown_difficulty' };
            onRemoveDifficulty(difficulty);
            return { ok: true, n: filterCounts(filters) };
          }
          case MAX_TIME:
            onRemoveMaxTime();
            return { ok: true, n: filterCounts(filters) };
          default:
            return { ok: false, error: 'unknown_filter' };
        }
      },
      [filters, onToggleCuisineQuick, onRemoveCategory, onRemoveDifficulty, onRemoveMaxTime],
    ),
  );

  useAssistantAction(
    AssistantAction.ClearFilters,
    useCallback(async (): Promise<AssistantActionResultType> => {
      if (activeFilterCount === ValueConstants.zero) return { ok: true, n: { filters: 0 } };
      onResetFilters();
      return { ok: true, n: { filters: 0 } };
    }, [activeFilterCount, onResetFilters]),
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

function parseFilter(arg: string | undefined): { kind: string; value: string } | null {
  const raw = arg ?? CharConstants.empty;
  const at = raw.indexOf(FIELD_SEPARATOR);
  if (at < ValueConstants.zero) return null;

  return {
    kind: raw.slice(ValueConstants.zero, at).trim(),
    value: raw.slice(at + FIELD_SEPARATOR.length).trim(),
  };
}

// The wire values are upper-case (`EASY`); a person says "easy". Matching
// case-insensitively is the difference between the filter applying and the
// model being told its own vocabulary is wrong.
function asDifficulty(value: string): Difficulty | null {
  const wanted = value.trim().toLocaleUpperCase();
  return Object.values(Difficulty).find((d) => d === wanted) ?? null;
}

function isSortKey(value: string): value is SortKey {
  return (Object.values(SortKey) as string[]).includes(value);
}

function filterCounts(filters: UiFilters): Record<string, number> {
  return {
    cuisine: filters.cuisines.length,
    category: filters.categories.length,
    difficulty: filters.difficulties.length,
  };
}
