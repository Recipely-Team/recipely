import type { PlannedRecipeIngredients } from '@domain/meal-plan/shopping/planned-recipe-ingredients';
import type { MealPlanIngredientsDto } from '@infrastructure/meal-plan/dtos/meal-plan-ingredients-dto';

/** `GET /me/meal-plan/ingredients` → one entry per planned recipe, lines as written (the domain scales them). */
export const toPlannedRecipeIngredients = (dto: MealPlanIngredientsDto): PlannedRecipeIngredients[] =>
  dto.recipes.map((recipe) => ({
    recipeId: recipe.recipeId,
    recipeName: recipe.recipeName,
    plannedServings: recipe.plannedServings,
    recipeServings: recipe.recipeServings,
    ingredients: recipe.ingredients,
  }));
