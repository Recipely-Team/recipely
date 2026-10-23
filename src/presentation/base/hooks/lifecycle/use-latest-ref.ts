import { type RefObject, useLayoutEffect, useRef } from 'react';

/**
 * A ref that always holds the value from the latest committed render.
 *
 * @remarks
 * - **For callbacks that outlive the render that made them** — a timer, an
 *   async continuation, a handler a registry keeps — and must read today's
 *   value, not the one they closed over.
 * - **Not for effects.** An effect that needs a value without re-running on it
 *   reads it through `useEffectEvent`; this hook is for the event handlers and
 *   continuations an Effect Event may not be called from.
 * - **Written in a layout effect, never during render.** A render may be
 *   thrown away (concurrent rendering, StrictMode's double render); writing the
 *   ref there would leak a value from a render that never committed, and it is
 *   the one ref access the React Compiler refuses to optimise around. Layout
 *   effects run before any passive effect and before the next input event, so
 *   no reader can see the previous value.
 */
export const useLatestRef = <T,>(value: T): RefObject<T> => {
  const ref = useRef(value);
  useLayoutEffect(() => {
    ref.current = value;
  });
  return ref;
};
