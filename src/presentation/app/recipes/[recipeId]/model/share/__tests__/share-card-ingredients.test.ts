import { shareCardIngredients } from '@presentation/app/recipes/[recipeId]/model/share/share-card-ingredients';

describe('shareCardIngredients', () => {
  it('prints names without amounts and drops group headers, which read as ingredients on a card', () => {
    expect(shareCardIngredients(['# Syrup', '200 g sugar', ' ', '100 ml water']).shown).toEqual(['sugar', 'water']);
  });

  it('prints five names and counts the rest as "+n more"', () => {
    const lines = Array.from({ length: 9 }, (_, i) => `item ${String(i + 1)}`);

    expect(shareCardIngredients(lines)).toEqual({ shown: lines.slice(0, 5), hidden: 4 });
  });
});
