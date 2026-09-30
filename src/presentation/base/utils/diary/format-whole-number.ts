import { ValueConstants } from '@core/constants';

/** A kcal or gram figure rounded to a whole number in the reader's locale — `1.429` in Turkish, `1,429` in English. */
export const formatWholeNumber = (value: number, locale: string): string =>
  Math.round(value).toLocaleString(locale, { maximumFractionDigits: ValueConstants.zero });
