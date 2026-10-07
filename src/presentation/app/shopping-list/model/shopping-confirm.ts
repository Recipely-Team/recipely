/** Which destructive question the Shopping list screen is asking, if any. */
export const ShoppingConfirm = {
  /** "Clear completed": every ticked line goes. */
  ClearChecked: 'clearChecked',
  /** "Clear all": the whole list goes. */
  ClearAll: 'clearAll',
} as const;

export type ShoppingConfirmType = (typeof ShoppingConfirm)[keyof typeof ShoppingConfirm];
