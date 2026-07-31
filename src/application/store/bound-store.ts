import type { StoreApi, UseBoundStore } from 'zustand';

/**
 * A Zustand store handle over `TState`.
 *
 * Replaces the fourteen per-store aliases that all said the same thing
 * (`AuthStore`, `CommentsStore`, …) and existed only to name a factory's
 * return type. One generic reads better at the point of use —
 * `BoundStore<AuthStoreState>` says what the handle IS, where `AuthStore` was
 * a name you had to look up — and it leaves every store module with a single
 * export: its factory.
 */
export type BoundStore<TState> = UseBoundStore<StoreApi<TState>>;
