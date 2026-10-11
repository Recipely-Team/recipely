/** One ingredient of `POST /fridge/scan` as it is on the wire. */
export interface FridgeIngredientDto {
  name: string;
  confidence: string;
}
