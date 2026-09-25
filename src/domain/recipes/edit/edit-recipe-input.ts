import type { Difficulty } from '@domain/recipes/difficulty';
import type { RecipeNutrition } from '@domain/recipes/recipe-nutrition';

/**
 * The fields an owner may change on a private recipe. Any non-empty subset;
 * text fields are keyed by locale, like the create payload.
 */
export interface EditRecipeInput {
  name?: Record<string, string>;
  ingredients?: Record<string, string[]>;
  instructions?: Record<string, string[]>;
  tags?: Record<string, string[]>;
  cuisine?: string;
  category?: string;
  difficulty?: Difficulty;
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  servings?: number;
  caloriesPerServing?: number;
  nutrition?: RecipeNutrition;
}
