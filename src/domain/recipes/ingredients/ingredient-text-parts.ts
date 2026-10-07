import type { Quantity } from '@domain/recipes/ingredients/quantity/quantity';

/** An ingredient line cut into its leading quantity and its name. */
export interface IngredientTextParts {
  quantity: Quantity;
  /** The amount and unit exactly as written: "2 yk.", "200g", "2-3 diş". */
  qtyText: string;
  /** The unit as written, or empty for a bare count. */
  unitToken: string;
  name: string;
  /** The decimal mark the amount was written with, or null when it had none. */
  decimalMark: string | null;
}
