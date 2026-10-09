import { ValueConstants } from '@core/constants';

const PERCENT = 100;

/**
 * A funnel step as a whole percentage of the step before it — 0 when the step
 * before is 0, so an empty range reads "0%" rather than nothing.
 */
export const funnelRate = (step: number, previous: number): number =>
  previous <= ValueConstants.zero ? ValueConstants.zero : Math.round((step / previous) * PERCENT);
