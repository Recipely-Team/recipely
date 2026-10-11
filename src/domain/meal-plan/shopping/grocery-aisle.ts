/**
 * The aisles the plan's shopping confirm groups ingredients by. Declaration
 * order is display order.
 */
export const GroceryAisle = {
  Produce: 'produce',
  Dairy: 'dairy',
  Protein: 'protein',
  Bakery: 'bakery',
  Pantry: 'pantry',
  Spices: 'spices',
} as const;

export type GroceryAisleType = (typeof GroceryAisle)[keyof typeof GroceryAisle];
