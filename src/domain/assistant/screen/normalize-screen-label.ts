import { CharConstants } from '@core/constants';

const WHITESPACE_RUN = /\s+/g;
const COMBINING_MARKS = /\p{M}/gu;
const DOTLESS_I = /ı/g;

/**
 * A label as the assistant compares it: lower case, accents and extra spaces gone.
 *
 * @remarks
 * - **Turkish-safe.** `İ`, `I` and `ı` all meet `i`, so "Kaydet" heard as
 *   "kaydet" and a label written "KAYDET" are the same control.
 */
export const normalizeScreenLabel = (label: string): string =>
  label
    .toLocaleLowerCase('tr')
    .normalize('NFD')
    .replace(COMBINING_MARKS, CharConstants.empty)
    .replace(DOTLESS_I, 'i')
    .replace(WHITESPACE_RUN, CharConstants.space)
    .trim();
