/**
 * **Fridge limits** — the backend's own bounds for `/fridge/scan` and `/fridge/ideas`.
 *
 * @remarks
 * - **Enforced before the request** where the user could trip them, so a call
 *   that would be refused never spends one of the day's 20 AI calls.
 */
export const FridgeLimits = {
  /** Photos one scan takes. */
  photosMax: 3,
  /** Ingredients one ideas request takes. */
  ingredientsMax: 40,
  /** Characters one ingredient name may have. */
  ingredientNameMax: 40,
  /** Idea titles one ideas request may exclude. */
  excludeMax: 12,
  /** Characters one excluded title may have. */
  excludeTitleMax: 120,
  servingsMin: 1,
  servingsMax: 12,
  /** What the servings stepper starts at. */
  servingsDefault: 2,
  /** The longest prompt `POST /recipes/generate` accepts. */
  promptMax: 5000,
} as const;
