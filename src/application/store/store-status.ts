/**
 * Every phase name a store — or a screen's own state machine — discriminates
 * on, in one place.
 *
 * @remarks
 * - **Why the literals still appear in the state unions.** A discriminated
 *   union is *defined* by its literals (`| { status: 'loaded'; recipes: … }`),
 *   and writing `typeof StoreStatus.Loaded` in twenty type definitions would
 *   make them harder to read for no safety gained. The two cannot drift
 *   silently: a member here that no union contains fails to compile at every
 *   `set()` that uses it. The union is the definition; this is the reference
 *   the rest of the code points at.
 * - **One vocabulary, not one per store.** `idle` / `loading` / `error` meant
 *   the same thing in eleven stores and were typed out in each. The
 *   feature-specific phases (`generating`, `refining`, …) sit here too so the
 *   set a reader has to know is one list, not eleven.
 */
export const StoreStatus = {
  Idle: 'idle',
  Loading: 'loading',
  Loaded: 'loaded',
  Ready: 'ready',
  Success: 'success',
  Error: 'error',
  Creating: 'creating',
  Generating: 'generating',
  Refining: 'refining',
  Deleting: 'deleting',
  Authenticated: 'authenticated',
  Unauthenticated: 'unauthenticated',
  Resolved: 'resolved',
  Unavailable: 'unavailable',
} as const;

// eslint-disable-next-line @typescript-eslint/no-redeclare -- intentional enum-style value + type pairing
export type StoreStatus = (typeof StoreStatus)[keyof typeof StoreStatus];
