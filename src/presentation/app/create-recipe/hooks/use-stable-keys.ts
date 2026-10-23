import { useState } from 'react';
import { assignStableKeys } from '@presentation/app/create-recipe/model/drafting/assign-stable-keys';
import { ValueConstants } from '@core/constants';

const KEY_PREFIX = 'row-';

/** The keys handed out for one list of values, and how many keys exist so far. */
interface Keyed {
  values: readonly string[];
  keys: readonly string[];
  issued: number;
}

/** Re-keys `values` against `previous`, issuing new keys after the last one handed out. */
const rekey = (previous: Keyed | null, values: readonly string[]): Keyed => {
  let issued = previous?.issued ?? ValueConstants.zero;
  const newKey = (): string => {
    issued += ValueConstants.one;
    return `${KEY_PREFIX}${String(issued)}`;
  };
  const keys =
    previous === null ? values.map(() => newKey()) : assignStableKeys(previous.values, previous.keys, values, newKey);
  return { values, keys, issued };
};

/**
 * Stable React keys for an editable list of plain strings (steps, ingredient
 * lines): a row keeps its key when rows are added, removed, edited or moved,
 * so a TextInput's focus and height never jump to a sibling (rule 9).
 *
 * @remarks
 * - **State adjusted during render, not a ref.** A new list is re-keyed in the
 *   same render it arrives in, the way React documents for state that follows
 *   a prop; a ref written during render would leak keys from a render React
 *   threw away.
 */
export function useStableKeys(values: readonly string[]): readonly string[] {
  const [keyed, setKeyed] = useState(() => rekey(null, values));
  if (keyed.values === values) return keyed.keys;
  const next = rekey(keyed, values);
  setKeyed(next);
  return next.keys;
}
