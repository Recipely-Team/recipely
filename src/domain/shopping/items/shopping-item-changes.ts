/** An edit to one line: only the fields set are sent; `null` clears an amount or a unit. */
export interface ShoppingItemChanges {
  readonly label?: string;
  readonly quantity?: number | null;
  readonly unit?: string | null;
  readonly checked?: boolean;
}
