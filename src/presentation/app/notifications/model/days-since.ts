import { TimeConstants, ValueConstants } from '@core/constants';

/** Whole days since `createdAt`, never negative (a clock behind the server's reads as today). */
export const daysSince = (createdAt: Date): number =>
  Math.max(ValueConstants.zero, Math.floor((Date.now() - createdAt.getTime()) / TimeConstants.millisecondsPerDay));
