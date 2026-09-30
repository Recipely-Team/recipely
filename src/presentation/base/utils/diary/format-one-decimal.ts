import { ValueConstants } from '@core/constants';

/** Servings or litres with at most one decimal in the reader's locale — `1,5` in Turkish, `1.5` in English. */
export const formatOneDecimal = (value: number, locale: string): string =>
  value.toLocaleString(locale, { maximumFractionDigits: ValueConstants.one });
