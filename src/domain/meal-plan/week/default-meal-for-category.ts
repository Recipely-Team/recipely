import { MealSlot, type MealSlotType } from '@domain/diary/meal-slot';
import { RecipeCategory } from '@domain/recipes/taxonomy/recipe-category';

const BY_CATEGORY: Readonly<Record<string, MealSlotType>> = {
  [RecipeCategory.Breakfast]: MealSlot.Breakfast,
  [RecipeCategory.Dessert]: MealSlot.Snacks,
  [RecipeCategory.Appetizer]: MealSlot.Snacks,
  [RecipeCategory.Snack]: MealSlot.Snacks,
  [RecipeCategory.Salad]: MealSlot.Lunch,
  [RecipeCategory.SideDish]: MealSlot.Lunch,
  [RecipeCategory.Lunch]: MealSlot.Lunch,
};

/** The meal a recipe is planned into by default: breakfast → Breakfast, dessert / appetizer → Snack, salad / side → Lunch, else Dinner. */
export const defaultMealForCategory = (category: string): MealSlotType => BY_CATEGORY[category] ?? MealSlot.Dinner;
