import { useEffect, useState } from 'react';

/**
 * Mirrors `value`, but only after it has held still for `delayMs`.
 *
 * The point is a keystroke-driven field that feeds a network request: the raw
 * value keeps the input responsive on every character while the debounced one
 * paces the fetch, so a fast typist produces one request when they pause rather
 * than one per letter. Every change restarts the timer, and the timer is
 * cleared on unmount so a pending update can never land after teardown.
 *
 * Callers that need to show a "still typing" state can compare the raw value
 * with the returned one — they differ exactly while a change is pending.
 */
export const useDebouncedValue = <T,>(value: T, delayMs: number): T => {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const handle = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(handle);
  }, [value, delayMs]);

  return debounced;
};
