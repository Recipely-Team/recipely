/**
 * A unit an amount can be counted in: a serving unit (`glass` = 200 ml) or the
 * base unit itself (`ml` = 1). `amount` is in the product's base unit.
 */
export interface FoodUnit {
  readonly key: string;
  readonly amount: number;
}
