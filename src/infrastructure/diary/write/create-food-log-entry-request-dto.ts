import type { MealSlotWireType } from '@infrastructure/diary/dtos/meal-slot-wire-dto';
import type { FoodLogProductDto } from '@infrastructure/diary/foods/dtos/food-log-product-dto';

// Body of `POST /diary/entries`. Nutrients are for the whole logged amount;
// a macro the food never reported travels as `null`. `product` is sent only
// for a catalogue product, whose `servings` is the quantity of its unit.
export interface CreateFoodLogEntryRequestDto {
  date: string;
  meal: MealSlotWireType;
  name: string;
  servings: number;
  calories: number;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  fiber: number | null;
  recipeId: string | null;
  product?: FoodLogProductDto;
}
