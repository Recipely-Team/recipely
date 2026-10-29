import type { ShoppingOutbox } from '@domain/shopping/outbox/shopping-outbox';

/** What one pass over the shopping outbox did. */
export interface ShoppingFlushReport {
  /** Writes the API accepted (or found already done: a delete of a line that is gone). */
  readonly sent: number;
  /** Writes the API refused for good (a 4xx): dropped, so the list should re-read the server. */
  readonly refused: number;
  /** What is still waiting: the pass stopped at the first write that could not reach the API. */
  readonly remaining: ShoppingOutbox;
}
