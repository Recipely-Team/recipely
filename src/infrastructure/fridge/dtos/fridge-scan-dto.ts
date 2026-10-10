import type { FridgeIngredientDto } from '@infrastructure/fridge/dtos/fridge-ingredient-dto';

/** `POST /fridge/scan` response: at most 30 ingredients. */
export interface FridgeScanDto {
  ingredients: FridgeIngredientDto[];
}
