import { CharConstants, ValueConstants } from '@core/constants';
import { VULGAR_FRACTIONS, fractionValue } from '@domain/recipes/ingredients/quantity/vulgar-fractions';

/**
 * Reads the amount an ingredient line opens with: `2`, `1,5`, `1.5`, `1/2`,
 * `1 1/2`, `½`, `1½`, and a range of any of them (`2-3`, `1/2 – 1`).
 *
 * @remarks
 * - **Order matters**: a mixed number is tried before a bare integer, or
 *   "1 1/2" would read as 1 followed by the name "1/2".
 * - **Both decimal marks**: Turkish recipes write `1,5`, English ones `1.5`.
 * - **`length`** is how many characters of the line the amount took, so the
 *   caller can cut the unit and the name off the rest.
 * - **Nothing invented**: a zero, an infinite or an unreadable amount is
 *   `null`, and the line then renders exactly as written.
 */
const GLYPH = `[${Object.keys(VULGAR_FRACTIONS).join(CharConstants.empty)}]`;

const num = (text: string | undefined): number => Number((text ?? CharConstants.empty).replace(CharConstants.comma, CharConstants.dot));
const frac = (text: string | undefined): number => fractionValue(text ?? CharConstants.empty);

const PATTERNS: readonly { re: RegExp; read: (m: RegExpMatchArray) => number }[] = [
  { re: /^(\d+)\s+(\d+\/\d+)/, read: ([, whole, part]) => num(whole) + frac(part) },
  { re: new RegExp(String.raw`^(\d+)\s*(${GLYPH})`, 'u'), read: ([, whole, part]) => num(whole) + frac(part) },
  { re: /^(\d+\/\d+)/, read: ([, part]) => frac(part) },
  { re: new RegExp(`^(${GLYPH})`, 'u'), read: ([, part]) => frac(part) },
  { re: /^(\d+(?:[.,]\d+)?)/, read: ([, value]) => num(value) },
];

const RANGE_DASH = /^\s*[-–]\s*/;
// "1.000" / "1,000": a thousands group or a decimal, depending on who wrote it — not read at all.
const GROUPED_THOUSANDS = /^\d{1,3}(?:[.,]\d{3})+(?!\d)/;

const readOne = (text: string): { value: number; length: number } | null => {
  if (GROUPED_THOUSANDS.test(text)) return null;
  for (const { re, read } of PATTERNS) {
    const match = text.match(re);
    if (match === null) continue;
    const value = read(match);
    return Number.isFinite(value) && value > ValueConstants.zero ? { value, length: match[ValueConstants.zero].length } : null;
  }
  return null;
};

export const parseAmount = (text: string): { amount: number; upTo: number | null; length: number } | null => {
  const first = readOne(text);
  if (first === null) return null;
  const dash = text.slice(first.length).match(RANGE_DASH);
  const second = dash === null ? null : readOne(text.slice(first.length + dash[ValueConstants.zero].length));
  if (dash === null || second === null || second.value <= first.value) {
    return { amount: first.value, upTo: null, length: first.length };
  }
  return { amount: first.value, upTo: second.value, length: first.length + dash[ValueConstants.zero].length + second.length };
};
