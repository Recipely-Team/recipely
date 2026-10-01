import { ValueConstants } from '@core/constants';

/**
 * A count as a profile header prints it: "12,4 B" in Turkish, "12.4K" in
 * English — the locale's own compact notation, one decimal at most. An engine
 * without compact notation prints the whole number instead.
 */
export const formatCompactCount = (value: number, locale: string): string => {
  try {
    return new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: ValueConstants.one }).format(value);
  } catch {
    return value.toLocaleString(locale);
  }
};
