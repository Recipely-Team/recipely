import { CharConstants } from '@core/constants';
import type { FoodProduct } from '@domain/diary/foods/product/food-product';
import type { RecipeFoodHit } from '@domain/diary/foods/search/recipe-food-hit';
import { RecentFoodKind } from '@domain/diary/foods/search/recent-food-kind';
import type { RecentFoodType } from '@domain/diary/foods/search/recent-food';
import type { FoodCandidateType } from '@presentation/base/hooks/assistant/args/diary/food-candidate';
import { FoodSource, type FoodSourceType } from '@presentation/base/hooks/assistant/args/diary/food-source';

/** What a food search found, group by group — from the use case's first pages or the sheet's store. */
interface FoundFoods {
  saved: readonly RecipeFoodHit[];
  mine: readonly RecipeFoodHit[];
  products: readonly FoodProduct[];
  recipes: readonly RecipeFoodHit[];
}

const PER_SERVING = 'per serving';
const PER_HUNDRED = 'per 100';
const PER = 'per';

/**
 * Every food the assistant could log by name, in the order ties are broken:
 * the server search's groups as the Add food sheet shows them — saved, mine,
 * products, Recipely — then recent foods (`GET /diary/foods/recent`, so a
 * recent product is a product, at the unit it was logged in).
 */
export const buildFoodCandidates = (found: FoundFoods | null, recent: readonly RecentFoodType[]): FoodCandidateType[] => {
  const recipes = (hits: readonly RecipeFoodHit[], source: FoodSourceType): FoodCandidateType[] =>
    hits.map((hit) => ({ kind: 'food', source, name: hit.name, kcal: hit.perServing.calories, per: PER_SERVING, food: hit.food }));
  const recentCandidates = recent.map((item): FoodCandidateType => {
    if (item.kind === RecentFoodKind.Food) {
      return { kind: 'food', source: FoodSource.Recent, name: item.food.name, kcal: item.food.perServing.calories, per: PER_SERVING, food: item.food };
    }
    const one = item.product.defaultQuantity();
    return {
      kind: 'product',
      source: FoodSource.Recent,
      name: item.product.name,
      kcal: item.product.nutrientsFor(one).calories,
      per: [PER, one.value, one.unit.key].join(CharConstants.space),
      product: item.product,
    };
  });
  return [
    ...(found === null
      ? []
      : [
          ...recipes(found.saved, FoodSource.Saved),
          ...recipes(found.mine, FoodSource.Mine),
          ...found.products.map(
            (product): FoodCandidateType => ({
              kind: 'product',
              source: FoodSource.Product,
              name: product.displayName,
              kcal: product.per100.calories,
              per: [PER_HUNDRED, product.unit].join(CharConstants.space),
              product: product.loggable,
            }),
          ),
          ...recipes(found.recipes, FoodSource.Recipely),
        ]),
    ...recentCandidates,
  ];
};
