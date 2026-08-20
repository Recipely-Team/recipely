import { ValueConstants } from '@core/constants';

/**
 * A star rating as one decimal place — `4.5`, never `4.4999999999999996`.
 *
 * One function rather than a `.toFixed(1)` at each of the six places a rating
 * is drawn: the precision is a display decision, and six copies of it are six
 * chances for the feed card and the detail header to disagree about the same
 * recipe. `1` is also exactly the kind of bare literal rule 5 asks to name.
 */
export const formatRating = (rating: number): string => rating.toFixed(ValueConstants.one);
