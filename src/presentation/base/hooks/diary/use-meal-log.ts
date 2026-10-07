import { useCallback, useEffect, useRef, useState } from 'react';
import { CharConstants, ValueConstants } from '@core/constants';
import type { MealSlotType } from '@domain/diary/meal-slot';
import type { MealCandidate } from '@domain/diary/meal/meal-candidate';
import type { MealParseInputType } from '@domain/diary/meal/meal-parse-input';
import { MealParseInputKind } from '@domain/diary/meal/meal-parse-input-kind';
import { useStores } from '@presentation/bootstrap/use-stores';
import { useMealPhotoPick } from '@presentation/base/hooks/diary/use-meal-photo-pick';
import { parseDecimalInput } from '@presentation/base/utils/diary/parse-decimal-input';
import { MealLogPhase } from '@presentation/base/widgets/diary/add-food/meal/state/meal-log-phase';
import type { MealLogState } from '@presentation/base/widgets/diary/add-food/meal/state/meal-log-state';
import type { MealReviewRow } from '@presentation/base/widgets/diary/add-food/meal/state/meal-review-row';
import type { MealLog } from '@presentation/base/widgets/diary/add-food/meal/state/meal-log';
import { useLocale } from '@presentation/i18n';

/** What the panel lends the hook. */
interface MealLogOptions {
  /** A description to parse at once (the assistant's `logMeal`); null waits for the user. */
  initialText: string | null;
  /** Logs the chosen candidates in `meal`; resolves one flag per candidate, true when it was saved. */
  onLog: (candidates: readonly MealCandidate[], meal: MealSlotType) => Promise<readonly boolean[]>;
}

const rowOf = (candidate: MealCandidate, index: number): MealReviewRow => ({
  key: String(index),
  candidate,
  included: true,
  gramsText: String(candidate.grams),
});

/**
 * "Describe or photograph your meal": a description or photo → the parser →
 * an editable confirm list → the chosen rows logged through the sheet's writes.
 *
 * @remarks
 * - **Page-scoped state** (like the auth forms): the list lives while the Add
 *   food sheet is open, and nothing else reads it.
 * - **Only the latest parse lands**: a late answer after "Start over" or a
 *   second parse is dropped.
 * - **Grams rescale through `MealCandidate.withGrams`** — the rule is the
 *   domain's; a box that does not read as a number keeps the last amount.
 * - **A partial save keeps the rows that failed**, so "Add" retries only them;
 *   a full save leaves the list as it was while the sheet closes.
 */
export const useMealLog = ({ initialText, onLog }: MealLogOptions): MealLog => {
  const { parseMeal } = useStores();
  const locale = useLocale();
  const pickPhotoInput = useMealPhotoPick(locale);
  const [state, setState] = useState<MealLogState>({ phase: MealLogPhase.Compose });
  const [text, setText] = useState(initialText ?? CharConstants.empty);
  const [photoDenied, setPhotoDenied] = useState(false);
  const latest = useRef(ValueConstants.zero);

  const parse = useCallback(
    async (input: MealParseInputType): Promise<void> => {
      latest.current += ValueConstants.one;
      const ticket = latest.current;
      setState({ phase: MealLogPhase.Parsing });
      const result = await parseMeal.execute(input);
      if (ticket !== latest.current) return;
      if (!result.ok) return setState({ phase: MealLogPhase.Failed, failure: result.failure, retry: input });
      setState({ phase: MealLogPhase.Review, rows: result.value.items.map(rowOf), note: result.value.note });
    },
    [parseMeal],
  );

  useEffect(() => {
    if (initialText === null) return;
    setText(initialText);
    void parse({ kind: MealParseInputKind.Text, text: initialText, locale });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only a new assistant description re-parses
  }, [initialText]);

  const updateRows = (change: (row: MealReviewRow) => MealReviewRow) =>
    setState((s) => (s.phase === MealLogPhase.Review ? { ...s, rows: s.rows.map(change) } : s));

  const rows = state.phase === MealLogPhase.Review ? state.rows : [];
  const chosen = rows.filter((row) => row.included);

  return {
    state,
    text,
    setText,
    photoDenied,
    parseText: () => void parse({ kind: MealParseInputKind.Text, text, locale }),
    pickPhoto: () => {
      setPhotoDenied(false);
      void pickPhotoInput().then((picked) => {
        if (picked.photo !== null) void parse(picked.photo);
        else if (picked.denied) setPhotoDenied(true);
      });
    },
    retry: () => {
      if (state.phase === MealLogPhase.Failed) void parse(state.retry);
    },
    edit: () => {
      latest.current += ValueConstants.one;
      setState({ phase: MealLogPhase.Compose });
    },
    toggle: (key) => updateRows((row) => (row.key === key ? { ...row, included: !row.included } : row)),
    setGrams: (key, value) =>
      updateRows((row) => {
        if (row.key !== key) return row;
        const grams = parseDecimalInput(value);
        const candidate = grams !== null && grams > ValueConstants.zero ? row.candidate.withGrams(grams) : row.candidate;
        return { ...row, candidate, gramsText: value };
      }),
    selectedCount: chosen.length,
    selectedCalories: chosen.reduce((sum, row) => sum + row.candidate.nutrients.calories, ValueConstants.zero),
    add: async (meal) => {
      if (chosen.length === ValueConstants.zero) return;
      const saved = await onLog(chosen.map((row) => row.candidate), meal);
      if (saved.every(Boolean)) return;
      const savedKeys = new Set(chosen.filter((_, i) => saved[i] === true).map((row) => row.key));
      setState((s) => (s.phase === MealLogPhase.Review ? { ...s, rows: s.rows.filter((row) => !savedKeys.has(row.key)) } : s));
    },
  };
};
