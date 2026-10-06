import { useRef } from 'react';
import { assignStableKeys } from '@presentation/app/create-recipe/model/drafting/assign-stable-keys';
import { ValueConstants } from '@core/constants';

const KEY_PREFIX = 'row-';

/**
 * Stable React keys for an editable list of plain strings (steps, ingredient
 * lines): a row keeps its key when rows are added, removed, edited or moved,
 * so a TextInput's focus and height never jump to a sibling (rule 9).
 */
export function useStableKeys(values: readonly string[]): readonly string[] {
  const counter = useRef(ValueConstants.zero);
  const state = useRef<{ values: readonly string[]; keys: readonly string[] } | null>(null);
  const newKey = (): string => `${KEY_PREFIX}${String((counter.current += 1))}`;
  const previous = state.current;
  const next =
    previous === null
      ? { values, keys: values.map(() => newKey()) }
      : previous.values === values
        ? previous
        : { values, keys: assignStableKeys(previous.values, previous.keys, values, newKey) };
  state.current = next;
  return next.keys;
}
