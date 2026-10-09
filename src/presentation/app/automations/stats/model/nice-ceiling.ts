import { ValueConstants } from '@core/constants';

const BASE = 10;
const STEPS = [1, 2, 5, 10] as const;

/** The chart's top: the smallest 1, 2 or 5 × 10ⁿ at or above `max` (1 for an empty range). */
export const niceCeiling = (max: number): number => {
  if (max <= ValueConstants.one) return ValueConstants.one;
  const magnitude = BASE ** Math.floor(Math.log10(max));
  const step = STEPS.find((s) => s * magnitude >= max) ?? BASE;
  return step * magnitude;
};
