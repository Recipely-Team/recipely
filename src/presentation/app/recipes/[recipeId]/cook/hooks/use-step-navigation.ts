import { useCallback, useState } from 'react';
import { ValueConstants } from '@core/constants';
import type { StepNavigation } from '@presentation/app/recipes/[recipeId]/cook/model/step-navigation';

/**
 * Which step of `count` is on screen, kept inside the steps that exist.
 *
 * @remarks
 * - **Every move is clamped.** "Next" on the last step and "previous" on the
 *   first stay put, and a jump to step 40 of 8 lands on 8 — a swipe, a button
 *   and the assistant can all ask for anything without checking first.
 * - **Moves report whether they moved**, so the caller can tell "you are on
 *   the last step" apart from "here is the next one".
 * - **A recipe whose steps shrink** (re-fetched while open) cannot leave the
 *   index past its end: the index is clamped when read, not only when set.
 */
export const useStepNavigation = (count: number): StepNavigation => {
  const [requested, setRequested] = useState<number>(ValueConstants.zero);
  const last = Math.max(count - ValueConstants.one, ValueConstants.zero);
  const index = Math.min(Math.max(requested, ValueConstants.zero), last);

  const goTo = useCallback(
    (target: number): boolean => {
      const clamped = Math.min(Math.max(target, ValueConstants.zero), last);
      if (clamped === index) return false;
      setRequested(clamped);
      return true;
    },
    [index, last],
  );
  const next = useCallback(() => goTo(index + ValueConstants.one), [goTo, index]);
  const previous = useCallback(() => goTo(index - ValueConstants.one), [goTo, index]);

  return { index, isFirst: index === ValueConstants.zero, isLast: index === last, goTo, next, previous };
};
