// `POST /me/shopping-list/items` body: 1–100 lines; absent fields are left out, not sent as null.
export interface ShoppingAddRequestDto {
  items: {
    label: string;
    quantity?: number;
    unit?: string;
    recipeId?: string;
    recipeName?: string;
  }[];
}
