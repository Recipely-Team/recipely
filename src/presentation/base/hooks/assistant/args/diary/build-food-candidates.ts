import type { LoggableFood } from '@domain/diary/entry/loggable-food';
import type { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';
import type { FoodCandidate } from '@presentation/base/hooks/assistant/args/diary/food-candidate';
import { FoodSource, type FoodSourceType } from '@presentation/base/hooks/assistant/args/diary/food-source';

/** The recipe lists the assistant searches, as the stores hold them. */
interface RecipeLists {
  mine: readonly RecipeSummaryEntity[];
  saved: readonly RecipeSummaryEntity[];
  feed: readonly RecipeSummaryEntity[];
}

/**
 * Every food the assistant could log by name, in the order ties are broken:
 * the user's own recipes, saved ones, the loaded feed, then recent foods.
 * A recipe appears once, and only when it has calories — nothing else can be
 * logged (the same rule as the Add food sheet's Recipes tab).
 */
export const buildFoodCandidates = (lists: RecipeLists, recent: readonly LoggableFood[]): FoodCandidate[] => {
  const seen = new Set<string>();
  const recipes = (list: readonly RecipeSummaryEntity[], source: FoodSourceType): FoodCandidate[] =>
    list
      .filter((recipe) => {
        if (seen.has(recipe.id) || !recipe.hasCalories) return false;
        seen.add(recipe.id);
        return true;
      })
      .map((recipe) => ({ kind: 'recipe', source, name: recipe.name, kcal: recipe.caloriesPerServing, recipe }));
  return [
    ...recipes(lists.mine, FoodSource.Mine),
    ...recipes(lists.saved, FoodSource.Saved),
    ...recipes(lists.feed, FoodSource.Recipely),
    ...recent.map((food): FoodCandidate => ({ kind: 'food', source: FoodSource.Recent, name: food.name, kcal: food.perServing.calories, food })),
  ];
};
