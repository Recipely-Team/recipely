export interface ShoppingItemEntityProps {
  id: string;
  label: string;
  /** Null for a line with no amount ("salt"). */
  quantity: number | null;
  /** As the user or the recipe wrote it ("kg", "su bardağı"); null for a bare count or none. */
  unit: string | null;
  /** The recipe the line was added from; null for a line typed in by hand. */
  recipeId: string | null;
  recipeName: string | null;
  checked: boolean;
  /** The server's order within the list. */
  position: number;
  createdAt: Date;
  updatedAt: Date;
}
