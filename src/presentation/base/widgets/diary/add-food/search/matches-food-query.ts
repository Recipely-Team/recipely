import { ValueConstants } from '@core/constants';

/**
 * Whether a food's name contains the search, compared with the reader's
 * locale rules — Turkish `İ` lower-cases to `i`, which a plain
 * `toLowerCase()` gets wrong. An empty query matches everything.
 */
export const matchesFoodQuery = (name: string, query: string, locale: string): boolean => {
  const needle = query.trim().toLocaleLowerCase(locale);
  return needle.length === ValueConstants.zero || name.toLocaleLowerCase(locale).includes(needle);
};
