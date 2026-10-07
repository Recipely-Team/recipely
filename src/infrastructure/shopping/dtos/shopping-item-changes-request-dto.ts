// `PATCH /me/shopping-list/items/:id` body: any of these; null clears an amount or a unit.
export interface ShoppingItemChangesRequestDto {
  label?: string;
  quantity?: number | null;
  unit?: string | null;
  checked?: boolean;
}
