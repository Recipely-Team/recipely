import { shareCardIngredients } from '@presentation/app/recipes/[recipeId]/model/share/share-card-ingredients';

describe('shareCardIngredients', () => {
  it('drops component headers, which read as ingredients on a card', () => {
    expect(shareCardIngredients(['# Syrup', '200 g sugar', ' ', '100 ml water']).shown).toEqual(['200 g sugar', '100 ml water']);
  });

  it('prints six lines and counts the rest as "+n more"', () => {
    const lines = Array.from({ length: 9 }, (_, i) => `item ${String(i + 1)}`);

    expect(shareCardIngredients(lines)).toEqual({ shown: lines.slice(0, 6), hidden: 3 });
  });
});
