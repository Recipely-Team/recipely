import type { ShoppingPendingWriteKind } from '@domain/shopping/outbox/shopping-pending-write-kind';

/**
 * A shopping-list change made while the API was out of reach, waiting to be sent. Only
 * changes that are safe to send twice are ever queued (Google AIP-194): a tick sets the line's
 * state rather than toggling it, and deleting a deleted line changes nothing.
 */
export type ShoppingPendingWriteType =
  | { readonly kind: typeof ShoppingPendingWriteKind.Check; readonly itemId: string; readonly isChecked: boolean }
  | { readonly kind: typeof ShoppingPendingWriteKind.Delete; readonly itemId: string };
