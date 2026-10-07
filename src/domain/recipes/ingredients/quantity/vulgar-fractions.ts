import { CharConstants } from '@core/constants';

/**
 * The Unicode fractions a recipe may write instead of `1/2`, each with the
 * plain fraction it stands for — the parser reads both through one path, and
 * the formatter writes the common ones back.
 */
export const VULGAR_FRACTIONS: Readonly<Record<string, string>> = {
  '¼': '1/4',
  '½': '1/2',
  '¾': '3/4',
  '⅓': '1/3',
  '⅔': '2/3',
  '⅛': '1/8',
  '⅜': '3/8',
  '⅝': '5/8',
  '⅞': '7/8',
};

/** The value of `n/d` (or of a glyph); NaN when it is neither. */
export const fractionValue = (text: string): number => {
  const [numerator, denominator] = (VULGAR_FRACTIONS[text] ?? text).split(CharConstants.slash);
  return Number(numerator) / Number(denominator);
};
