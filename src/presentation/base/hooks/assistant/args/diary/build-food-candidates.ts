import { CharConstants } from '@core/constants';
import type { LoggableFood } from '@domain/diary/entry/loggable-food';
import type { FoodSearchResults } from '@domain/diary/foods/search/food-search-results';
import type { RecipeFoodHit } from '@domain/diary/foods/search/recipe-food-hit';
import type { FoodCandidate } from '@presentation/base/hooks/assistant/args/diary/food-candidate';
import { FoodSource, type FoodSourceType } from '@presentation/base/hooks/assistant/args/diary/food-source';

const PER_SERVING = 'per serving';
const PER_HUNDRED = 'per 100';

/**
 * Every food the assistant could log by name, in the order ties are broken:
 * the server search's groups as the Add food sheet shows them — saved, mine,
 * products, Recipely — then recent foods. The search already returns only
 * recipes with calories, each once.
 */
export const buildFoodCandidates = (results: FoodSearchResults | null, recent: readonly LoggableFood[]): FoodCandidate[] => {
  const recipes = (hits: readonly RecipeFoodHit[], source: FoodSourceType): FoodCandidate[] =>
    hits.map((hit) => ({ kind: 'food', source, name: hit.name, kcal: hit.perServing.calories, per: PER_SERVING, food: hit.food }));
  return [
    ...(results === null
      ? []
      : [
          ...recipes(results.saved.items, FoodSource.Saved),
          ...recipes(results.mine.items, FoodSource.Mine),
          ...results.products.items.map(
            (product): FoodCandidate => ({
              kind: 'product',
              source: FoodSource.Product,
              name: product.displayName,
              kcal: product.per100.calories,
              per: [PER_HUNDRED, product.unit].join(CharConstants.space),
              product: product.loggable,
            }),
          ),
          ...recipes(results.recipes.items, FoodSource.Recipely),
        ]),
    ...recent.map((food): FoodCandidate => ({ kind: 'food', source: FoodSource.Recent, name: food.name, kcal: food.perServing.calories, per: PER_SERVING, food })),
  ];
};
