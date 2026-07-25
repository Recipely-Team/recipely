import { RecipeCategory } from '@domain/recipes/taxonomy/recipe-category';

/** Single source of truth mapping each recipe category to its display emoji. */
export const CATEGORY_EMOJI: Record<RecipeCategory, string> = {
  [RecipeCategory.Breakfast]: '🍳',
  [RecipeCategory.Lunch]: '🥪',
  [RecipeCategory.Dinner]: '🍽️',
  [RecipeCategory.MainCourse]: '🍛',
  [RecipeCategory.Appetizer]: '🧆',
  [RecipeCategory.Soup]: '🍲',
  [RecipeCategory.Salad]: '🥗',
  [RecipeCategory.SideDish]: '🍚',
  [RecipeCategory.Snack]: '🍿',
  [RecipeCategory.Dessert]: '🍰',
  [RecipeCategory.Drink]: '🥤',
};
