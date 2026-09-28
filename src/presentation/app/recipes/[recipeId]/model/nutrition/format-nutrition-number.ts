import { ValueConstants } from '@core/constants';

/**
 * A nutrition figure in the reader's locale — `4,5` in Turkish, `4.5` in
 * English. At most one decimal: the domain has already rounded, this only
 * spells it.
 */
export const formatNutritionNumber = (value: number, locale: string): string =>
  value.toLocaleString(locale, { maximumFractionDigits: ValueConstants.one });
