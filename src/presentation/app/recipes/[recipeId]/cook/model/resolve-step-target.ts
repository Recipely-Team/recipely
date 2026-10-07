import { ValueConstants } from '@core/constants';
import { machineLower } from '@presentation/base/hooks/assistant/args/resolving/machine-case';
import { StepCursor } from '@presentation/base/hooks/assistant/args/resolving/step-cursor';

/**
 * The zero-based step a spoken `readStep` argument means, from the step on
 * screen, or `null` when there is no such step.
 *
 * `next` (also no argument at all), `previous`, `current`, or a 1-based number
 * ("read step 4"). "Next" past the last step is `null`, not the last step
 * again: the cook is told the recipe is finished rather than hearing a repeat.
 */
export const resolveStepTarget = (arg: string | undefined, index: number, count: number): number | null => {
  const asked = machineLower(arg ?? StepCursor.Next);
  const target =
    asked === StepCursor.Next
      ? index + ValueConstants.one
      : asked === StepCursor.Previous
        ? index - ValueConstants.one
        : asked === StepCursor.Current
          ? index
          : Number.parseInt(asked, 10) - ValueConstants.one;
  return Number.isInteger(target) && target >= ValueConstants.zero && target < count ? target : null;
};
