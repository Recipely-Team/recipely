import type { LoggableFood } from '@domain/diary/entry/loggable-food';
import type { LoggableProduct } from '@domain/diary/foods/loggable-product';
import type { FoodSourceType } from '@presentation/base/hooks/assistant/args/diary/food-source';

/**
 * Something the user may mean by a food's name: a food loggable in servings
 * (a recipe the search found, a recent food) or a catalogue product logged in
 * its own unit. `per` says what `kcal` is for, in the model's English.
 */
export type FoodCandidate =
  | { kind: 'food'; source: FoodSourceType; name: string; kcal: number; per: string; food: LoggableFood }
  | { kind: 'product'; source: FoodSourceType; name: string; kcal: number; per: string; product: LoggableProduct };
