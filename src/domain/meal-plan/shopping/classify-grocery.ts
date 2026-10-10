import { CharConstants, ValueConstants } from '@core/constants';
import { GroceryAisle, type GroceryAisleType } from '@domain/meal-plan/shopping/grocery-aisle';
import { GroceryKeywords } from '@domain/meal-plan/shopping/grocery-keywords';
import { groceryKey } from '@domain/meal-plan/shopping/grocery-key';

interface GroceryClass {
  aisle: GroceryAisleType;
  /** Salt, black pepper, oil: on the list, but unticked to start with. */
  isStaple: boolean;
  /** Water: never bought. */
  isSkipped: boolean;
}

const normalized = (words: readonly string[]): string[] => words.map(groceryKey);
const AISLE_WORDS = (Object.entries(GroceryKeywords.aisles) as [GroceryAisleType, readonly string[]][]).map(
  ([aisle, words]) => [aisle, normalized(words)] as const,
);
const STAPLES = normalized(GroceryKeywords.staples);
const SKIPPED = normalized(GroceryKeywords.skipped);

/** The keyword starts a word of `key` — "et" is meat in "et suyu", not in "beet". */
const startsAWord = (key: string, word: string): boolean => key.startsWith(word) || key.includes(`${CharConstants.space}${word}`);

const aisleOf = (key: string): GroceryAisleType => {
  let best: { aisle: GroceryAisleType; length: number } = { aisle: GroceryAisle.Pantry, length: ValueConstants.zero };
  for (const [aisle, words] of AISLE_WORDS) {
    for (const word of words) {
      if (word.length > best.length && startsAWord(key, word)) best = { aisle, length: word.length };
    }
  }
  return best.aisle;
};

/**
 * An ingredient name → its aisle, and whether it is a staple or not bought at
 * all, by the rules in `GroceryKeywords` (longest keyword wins; none is Pantry).
 */
export const classifyGrocery = (name: string): GroceryClass => {
  const key = groceryKey(name);
  return {
    aisle: aisleOf(key),
    isStaple: STAPLES.some((word) => key === word || key.startsWith(`${word}${CharConstants.space}`)),
    isSkipped: SKIPPED.some((word) => key === word || key.endsWith(`${CharConstants.space}${word}`)),
  };
};
