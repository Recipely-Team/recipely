import { CharConstants, ValueConstants } from '@core/constants';

/**
 * Splits `key=value`, the shape every "which one, and what to" request takes.
 *
 * @remarks
 * - **The separator is a wire protocol.** The model is told to say
 *   `cuisine=italian`, `difficulty=easy`, `bio=…`, `language=tr`, and four
 *   copies of `'='` across four screens is four chances for one of them to
 *   drift into a colon and answer nothing. Rule 5's own test — does the string
 *   appear twice — applies to it.
 * - **The FIRST separator wins**, so a value may contain one: a bio reading
 *   "cooking = joy" survives, which a split-on-every-`=` would not.
 * - **`null` for anything without one**, which every caller turns into the
 *   same `expected_..._equals_value` the model can act on: it knows the shape,
 *   so being told the shape was missing is enough to retry correctly.
 */
const SEPARATOR = '=';

export function parseKeyValue(arg: string | undefined): { key: string; value: string } | null {
  const raw = arg ?? CharConstants.empty;
  const at = raw.indexOf(SEPARATOR);
  if (at < ValueConstants.zero) return null;

  return {
    key: raw.slice(ValueConstants.zero, at).trim(),
    value: raw.slice(at + SEPARATOR.length).trim(),
  };
}
