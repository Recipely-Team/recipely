import { ValueConstants } from '@core/constants';

/**
 * **Keyed request epoch** — `RequestEpoch` per key: the newest request for one
 * id wins without cancelling requests for other ids.
 *
 * @remarks
 * - **One counter for every key**, so a number is never reused: clearing a key
 *   (or all of them) cannot make an old check true again.
 * - **`invalidate(key)`** drops one key's request; **`invalidate()`** drops all
 *   of them (sign-out).
 */
export class KeyedRequestEpoch<K = string> {
  private counter = ValueConstants.zero;
  private readonly latest = new Map<K, number>();

  start(key: K): () => boolean {
    this.counter += ValueConstants.one;
    const mine = this.counter;
    this.latest.set(key, mine);
    return () => this.latest.get(key) === mine;
  }

  invalidate(key?: K): void {
    if (key === undefined) this.latest.clear();
    else this.latest.delete(key);
  }
}
