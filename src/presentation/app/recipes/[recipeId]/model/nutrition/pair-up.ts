import { ValueConstants } from '@core/constants';

/** Splits a list into rows of two — the macro grid's two columns. */
export const pairUp = <T>(items: readonly T[]): T[][] => {
  const rows: T[][] = [];
  for (let i = ValueConstants.zero; i < items.length; i += ValueConstants.two) {
    rows.push(items.slice(i, i + ValueConstants.two));
  }
  return rows;
};
