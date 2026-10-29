/** What a queued shopping-list write does to its line. Also the stored `kind`. */
export const ShoppingPendingWriteKind = {
  Check: 'check',
  Delete: 'delete',
} as const;
