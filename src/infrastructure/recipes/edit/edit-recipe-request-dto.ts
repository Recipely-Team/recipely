import type { Difficulty } from '@domain/recipes/difficulty';
import type { NutritionDto } from '@infrastructure/recipes/dtos/nutrition-dto';

// Body of `PATCH /recipes/:id`: any non-empty subset, text keyed by locale.
export interface EditRecipeRequestDto {
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
  nutrition?: NutritionDto;
}
