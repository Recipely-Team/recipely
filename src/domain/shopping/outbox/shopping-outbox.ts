import { ValueConstants } from '@core/constants';
import { BaseValueObject } from '@core/value-object/base-value-object';
import { ShoppingPendingWriteKind } from '@domain/shopping/outbox/shopping-pending-write-kind';
import type { ShoppingPendingWriteType } from '@domain/shopping/outbox/shopping-pending-write';

/**
 * **Shopping outbox** — the shopping-list changes waiting for the API, at most one per line,
 * oldest line first.
 *
 * @remarks
 * - **The last word per line wins:** ticking a line twice offline sends only its final state;
 *   a delete replaces any tick of the same line, and a tick after a delete is dropped — the
 *   line is gone.
 * - **Immutable:** every change returns a new outbox, so a store can hold one safely.
 */
export class ShoppingOutbox extends BaseValueObject<readonly ShoppingPendingWriteType[]> {
  private constructor(writes: readonly ShoppingPendingWriteType[]) {
    super(writes);
  }

  static empty(): ShoppingOutbox {
    return new ShoppingOutbox([]);
  }

  /** Rebuilds an outbox from stored writes, applying the same one-per-line rule as {@link with}. */
  static of(writes: readonly ShoppingPendingWriteType[]): ShoppingOutbox {
    return writes.reduce((outbox, write) => outbox.with(write), ShoppingOutbox.empty());
  }

  get writes(): readonly ShoppingPendingWriteType[] {
    return this._value;
  }

  isEmpty(): boolean {
    return this._value.length === ValueConstants.zero;
  }

  with(write: ShoppingPendingWriteType): ShoppingOutbox {
    const queued = this._value.find((pending) => pending.itemId === write.itemId);
    if (queued?.kind === ShoppingPendingWriteKind.Delete) return this;
    if (queued === undefined) return new ShoppingOutbox([...this._value, write]);
    return new ShoppingOutbox(this._value.map((pending) => (pending.itemId === write.itemId ? write : pending)));
  }

  /** The outbox without a line's write — sent, or refused for good. */
  without(itemId: string): ShoppingOutbox {
    return new ShoppingOutbox(this._value.filter((pending) => pending.itemId !== itemId));
  }

  override equals(other: BaseValueObject<readonly ShoppingPendingWriteType[]>): boolean {
    return other instanceof ShoppingOutbox && JSON.stringify(other.writes) === JSON.stringify(this._value);
  }
}
