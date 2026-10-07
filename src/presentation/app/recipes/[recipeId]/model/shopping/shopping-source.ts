/** What a recipe page hands "Add to shopping list": the recipe, and its lines as the reader sees them (scaled, converted). */
export interface ShoppingSource {
  recipeId: string;
  recipeName: string;
  lines: readonly string[];
}
