import type { EditRecipeInput } from '@domain/recipes/edit/edit-recipe-input';
import { CuisineKey } from '@domain/recipes/taxonomy/cuisine-key';
import type { EditableRecipe } from '@presentation/app/create-recipe/model/drafting/editable-recipe';
import { cleanLines } from '@presentation/app/create-recipe/model/saving/clean-lines';
import { cleanIngredients } from '@presentation/app/create-recipe/model/saving/clean-ingredients';

/**
 * Builds the PATCH payload for a private recipe from the editor state.
 *
 * Photos are not in it: the edit endpoint takes no media, and the owner adds
 * or removes photos on the recipe page, where each is its own request.
 */
export const buildEditInput = (recipe: EditableRecipe, locale: string): EditRecipeInput => ({
  name: { [locale]: recipe.name.trim() },
  cuisine: recipe.cuisine ?? CuisineKey.Other,
  category: recipe.category,
  difficulty: recipe.difficulty,
  ingredients: { [locale]: cleanIngredients(recipe.ingredients) },
  instructions: { [locale]: cleanLines(recipe.instructions) },
  prepTimeMinutes: recipe.prepTimeMinutes,
  cookTimeMinutes: recipe.cookTimeMinutes,
  servings: recipe.servings,
});
