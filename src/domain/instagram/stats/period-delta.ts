import { ValueConstants } from '@core/constants';

const PERCENT = 100;

/**
 * The change against the previous period, as a whole percentage — null when
 * the previous period had nothing, where any growth would be infinite.
 */
export const periodDelta = (current: number, previous: number): number | null =>
  previous <= ValueConstants.zero ? null : Math.round(((current - previous) / previous) * PERCENT);
