import { ValueConstants } from '@core/constants';
import { BaseValueObject } from '@core/value-object/base-value-object';

interface ViewerReactionValue {
  readonly count: number;
  readonly mine: boolean;
}

/**
 * **Viewer reaction** — a public count (likes, followers) together with whether the viewer
 * is one of them.
 *
 * @remarks
 * - **Moves by one with the viewer:** `set(true)` counts the viewer in, `set(false)` out;
 *   asking for the standing already held is a no-op, so a double tap never counts twice.
 * - **Never below zero:** a stale count from the server cannot go negative on an unlike.
 * - **`of` cannot fail:** a negative or non-finite count is read as zero, so there is no
 *   invalid reaction to report and no `Result` to unwrap.
 * - **Equality by value:** two reactions with the same count and standing are the same.
 */
export class ViewerReaction extends BaseValueObject<ViewerReactionValue> {
  private constructor(value: ViewerReactionValue) {
    super(value);
  }

  static of(count: number, mine: boolean): ViewerReaction {
    const safe = Number.isFinite(count) ? Math.max(ValueConstants.zero, Math.trunc(count)) : ValueConstants.zero;
    return new ViewerReaction({ count: safe, mine });
  }

  get count(): number {
    return this._value.count;
  }

  get mine(): boolean {
    return this._value.mine;
  }

  set(mine: boolean): ViewerReaction {
    if (mine === this.mine) return this;
    const step = mine ? ValueConstants.one : -ValueConstants.one;
    return ViewerReaction.of(this.count + step, mine);
  }

  toggled(): ViewerReaction {
    return this.set(!this.mine);
  }

  override equals(other: BaseValueObject<ViewerReactionValue>): boolean {
    return other instanceof ViewerReaction && other.count === this.count && other.mine === this.mine;
  }
}
