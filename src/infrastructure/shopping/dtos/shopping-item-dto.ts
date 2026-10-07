// One shopping-list line. Keep in sync with recipely-backend's shopping item DTO.
export interface ShoppingItemDto {
  id: string;
  label: string;
  quantity: number | null;
  unit: string | null;
  recipeId: string | null;
  recipeName: string | null;
  checked: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
}
