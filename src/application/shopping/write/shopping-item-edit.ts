/** The edit sheet's fields as typed: the amount is text until `UpdateShoppingItemUseCase` reads it. */
export interface ShoppingItemEdit {
  label: string;
  quantityText: string;
  unit: string;
}
