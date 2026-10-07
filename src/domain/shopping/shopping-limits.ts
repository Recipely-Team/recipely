/** The shopping list's own limits, as the backend enforces them. */
export const ShoppingLimits = {
  /** Lines one `POST /items` accepts. */
  batchMax: 100,
  /** Decimal places a quantity keeps: a scaled third of a cup is 0.33, not 0.333…. */
  quantityPlaces: 2,
} as const;
