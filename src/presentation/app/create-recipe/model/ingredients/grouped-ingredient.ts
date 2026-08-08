/** One ingredient, and where it sits in the stored flat array. */
export interface GroupedIngredient {
  value: string;
  /** Index in the flat `string[]` — every edit is written back by this. */
  index: number;
}
