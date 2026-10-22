import type { StoreApi, UseBoundStore } from 'zustand';

/**
 * A Zustand store handle over the contract `TStore` (its state and actions).
 *
 * @remarks
 * - **One generic, not an alias per store.** Fourteen aliases once named a
 *   factory's return type and said nothing more; `BoundStore<AuthStore>` says
 *   what the handle is at the point of use and leaves every store module with
 *   one export, its factory.
 * - **`AuthStore` is the contract, not the handle**: `state` plus actions, in
 *   `auth-store-contract.ts`. Its `state` is a union of named states.
 */
export type BoundStore<TStore> = UseBoundStore<StoreApi<TStore>>;
