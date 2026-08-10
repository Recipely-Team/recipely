import { container } from '@core/di/container';
import { TOKENS } from '@application/di/tokens';
import type { KeyValueStoreInterface } from '@domain/storage/key-value-store-interface';
import { noopKeyValueStore } from '@application/storage/noop-key-value-store';

/**
 * Resolves the platform key-value store from the DI container, falling back to
 * an inert no-op store when none is registered (DI-less unit test mounts). This
 * keeps presentation/application code off a concrete `@infrastructure` import.
 */
export const getKeyValueStore = (): KeyValueStoreInterface =>
  container.has(TOKENS.KeyValueStore)
    ? container.resolve<KeyValueStoreInterface>(TOKENS.KeyValueStore)
    : noopKeyValueStore;
