/**
 * Port for simple string key-value persistence. Implemented per platform in the
 * infrastructure layer (secure store on native, `localStorage` on web) and
 * resolved by consumers through the DI container so no layer above depends on a
 * concrete storage backend.
 */
export interface KeyValueStoreInterface {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}
