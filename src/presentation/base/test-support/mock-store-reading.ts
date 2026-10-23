import type { StoreApi } from 'zustand/vanilla';

/** Structural equality where any two functions count as equal (fakes re-create their jest.fn()s). */
const sameShape = (a: unknown, b: unknown): boolean => {
  if (Object.is(a, b)) return true;
  if (typeof a === 'function' && typeof b === 'function') return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  if (Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)) return false;
  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
  if (a instanceof Set && b instanceof Set) return a.size === b.size && [...a].every((item) => b.has(item));
  if (a instanceof Map && b instanceof Map) {
    return a.size === b.size && [...a].every(([key, value]) => b.has(key) && sameShape(value, b.get(key)));
  }
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  return keysA.every((key) => sameShape((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]));
};

/**
 * A read-only store whose state is whatever `read` returns at the moment it is read.
 *
 * @remarks
 * - **For tests that steer a store from a variable** (`mockStatus = 'loading'`,
 *   then re-render). Components read stores through `useStore`, which needs a
 *   real store handle; a bare selector function is not one.
 * - **The same state object while nothing changed.** `useStore` reads through
 *   `useSyncExternalStore`, which re-renders whenever a read returns a new
 *   reference; a fake that builds its state inline would loop forever, so a
 *   read structurally equal to the last one returns the last one.
 * - **Named `mock…`** so a `jest.mock` factory may refer to it.
 * - **It never notifies.** A test that changes the variable re-renders itself;
 *   a test that needs a store to push an update builds a real one with
 *   `createStore`.
 */
export const mockStoreReading = <T>(read: () => T): StoreApi<T> => {
  let last: { state: T } | null = null;
  const getState = (): T => {
    const next = read();
    if (last === null || !sameShape(last.state, next)) last = { state: next };
    return last.state;
  };
  return {
    getState,
    getInitialState: getState,
    setState: () => undefined,
    subscribe: () => () => undefined,
  };
};
