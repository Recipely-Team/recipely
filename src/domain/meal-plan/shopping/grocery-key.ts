import { CharConstants } from '@core/constants';

const COMBINING_MARKS = /[̀-ͯ]/g;
const RUNS_OF_SPACE = /\s+/g;

/**
 * An ingredient name reduced to what two spellings share: no accents, lower
 * case, single spaces — "Domates", "domates " and "DOMATES" are one line, and
 * "Süt" matches the keyword "sut". Used for merging and for the aisle rules,
 * never shown.
 */
export const groceryKey = (text: string): string =>
  text.normalize('NFKD').replace(COMBINING_MARKS, CharConstants.empty).toLowerCase().replace(RUNS_OF_SPACE, CharConstants.space).trim();
