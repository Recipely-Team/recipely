import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { ShoppingOutbox } from '@domain/shopping/outbox/shopping-outbox';

/** Keeps the shopping outbox on the device, so a queued change survives the app being closed. */
export interface ShoppingOutboxRepositoryInterface {
  /** The stored outbox; an empty one when nothing (or nothing readable) is stored. */
  load(): Promise<Result<ShoppingOutbox, Failure>>;
  save(outbox: ShoppingOutbox): Promise<Result<void, Failure>>;
}
