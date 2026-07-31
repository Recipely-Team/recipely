import type { KeyValueStoreInterface } from '@domain/storage/key-value-store-interface';

/**
 * In-memory test double for `KeyValueStoreInterface`. Backed by a `Map`, it round-trips
 * writes and reads exactly like the platform store, returning `null` for missing
 * keys. The synchronous `seed`, `peek`, and `clear` helpers let a test arrange
 * and assert on the backing without awaiting the async port surface.
 */
export class FakeKeyValueStore implements KeyValueStoreInterface {
  private readonly entries = new Map<string, string>();

  getItem(key: string): Promise<string | null> {
    return Promise.resolve(this.entries.get(key) ?? null);
  }

  setItem(key: string, value: string): Promise<void> {
    this.entries.set(key, value);
    return Promise.resolve();
  }

  removeItem(key: string): Promise<void> {
    this.entries.delete(key);
    return Promise.resolve();
  }

  /** Synchronously plants a value, as if it were persisted before the test ran. */
  seed(key: string, value: string): void {
    this.entries.set(key, value);
  }

  /** Synchronously reads the backing value (or `null`) for a persistence assertion. */
  peek(key: string): string | null {
    return this.entries.get(key) ?? null;
  }

  /** Empties the backing store between tests so no state leaks across cases. */
  clear(): void {
    this.entries.clear();
  }
}
