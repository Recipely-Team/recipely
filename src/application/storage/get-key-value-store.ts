import { container } from '@core/di/container-instance';
import { TOKENS } from '@application/di/tokens';
import type { IKeyValueStore } from '@domain/storage/i-key-value-store';
import { noopKeyValueStore } from '@application/storage/noop-key-value-store';

/**
 * Resolves the platform key-value store from the DI container, falling back to
 * an inert no-op store when none is registered (DI-less unit test mounts). This
 * keeps presentation/application code off a concrete `@infrastructure` import.
 */
export const getKeyValueStore = (): IKeyValueStore =>
  container.has(TOKENS.KeyValueStore)
    ? container.resolve<IKeyValueStore>(TOKENS.KeyValueStore)
    : noopKeyValueStore;
