/**
 * The recipe a planned meal points at, as the plan reads it — a read model
 * carried by every entry so a week renders without a second request. The
 * recipe aggregate is referenced by `id` only.
 */
export interface PlannedRecipe {
  readonly id: string;
  readonly name: string;
  readonly imageUrl: string | null;
  /** Null when the recipe has no nutrition yet; such a meal counts as 0 kcal. */
  readonly caloriesPerServing: number | null;
  /** What the recipe was written for — the base its ingredients scale from. */
  readonly servings: number;
  readonly totalTimeMinutes: number | null;
}
