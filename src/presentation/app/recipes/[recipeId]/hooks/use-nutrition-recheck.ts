import { useEffect, useRef, useState } from 'react';
import { ValueConstants } from '@core/constants';

/**
 * How long the backend's calculator is given before the screen asks again.
 *
 * Not a design measurement and not read anywhere else, so it stays here rather
 * than in a constants module (CLAUDE.md rule 5: the test is reuse, not type).
 */
const RECHECK_DELAY_MS = 15000;

/**
 * Asks once more for a recipe that arrived without nutrition.
 *
 * @remarks
 * - **The figures are computed after the recipe exists.** Publishing sends no
 *   nutrition — `CreateRecipeInput` has no such field — because the backend
 *   calculates it itself, once the recipe is saved. Open a recipe you have
 *   just published and the detail endpoint answers before that finishes, so
 *   the screen said "no nutritional info for this recipe yet", which is a
 *   statement about the recipe when the truth was a statement about the clock.
 * - **The screen never looked again.** The figures landed a moment later and
 *   the open page went on saying no. Re-entering the screen fixed it, which is
 *   how it was reported — and is exactly the tell for stale state rather than
 *   missing data.
 * - **Once, and only while someone is still there.** One extra GET, and only
 *   for a viewer who stayed on a nutrition-less recipe for the whole delay;
 *   the effect's cleanup cancels it for everyone who moved on. A recipe that
 *   genuinely has no figures — an old one the calculator never ran for — costs
 *   that one request and then stops asking, because a poll for something that
 *   is never coming is worse than the wrong caption.
 * - **Waiting spans the request, not the timer.** Clearing the flag when the
 *   timer fires would flip the caption to "not available" and then, a beat
 *   later, to real numbers. It clears when the answer is in, whatever the
 *   answer is.
 */
export const useNutritionRecheck = (
  recipeId: string,
  hasNutrition: boolean,
  reload: (id: string) => Promise<void>,
): boolean => {
  const [waiting, setWaiting] = useState(false);
  /** The recipe this hook has already spent its one recheck on. */
  const rechecked = useRef<string | null>(null);

  useEffect(() => {
    if (recipeId.length === ValueConstants.zero || hasNutrition) {
      setWaiting(false);
      return;
    }
    if (rechecked.current === recipeId) return;
    rechecked.current = recipeId;

    setWaiting(true);
    const timer = setTimeout(() => {
      void reload(recipeId).finally(() => setWaiting(false));
    }, RECHECK_DELAY_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [recipeId, hasNutrition, reload]);

  return waiting;
};
