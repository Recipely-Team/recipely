import { IngredientList } from '@domain/recipes/ingredients/ingredient-list';
import { IngredientLine } from '@domain/recipes/ingredients/ingredient-line';
import { RecipeServings } from '@domain/recipes/ingredients/recipe-servings';
import { UnitSystem } from '@domain/recipes/ingredients/unit-system';
import { RecipeLimits } from '@domain/recipes/recipe-limits';

describe('IngredientList', () => {
  it('counts ingredients, not headings or blanks', () => {
    // A recipe with three group headings does not have three more things to buy.
    expect(IngredientList.of(['# Dough', 'flour', '  ', 'For the syrup:', 'sugar']).filledCount).toBe(2);
  });

  it('has content once anything is typed, a heading included', () => {
    expect(IngredientList.of(['', '  ']).hasContent).toBe(false);
    expect(IngredientList.of(['', 'salt']).hasContent).toBe(true);
    expect(IngredientList.of(['# ']).hasContent).toBe(true);
  });

  it('cleans for saving: trimmed, no blanks, no unnamed heading', () => {
    expect(IngredientList.of(['  2 eggs ', '', '# ', '#  Syrup ', 'sugar']).cleaned()).toEqual(['2 eggs', '#  Syrup', 'sugar']);
  });

  it('presents every line scaled and converted, headings untouched', () => {
    const lines = ['# Hamur', '2 su bardağı un', 'tuz', '1 tutam karabiber'];
    expect(IngredientList.of(lines).present(2, UnitSystem.Metric)).toEqual(['# Hamur', '800 ml un', 'tuz', '2 tutam karabiber']);
  });

  it('writes a new decimal with the fallback mark when the recipe wrote none', () => {
    expect(IngredientList.of(['1 kg un']).present(1.5, UnitSystem.Original, ',')).toEqual(['1,5 kg un']);
  });
});

describe('IngredientLine.heading', () => {
  it('writes the marker the editor and every reader agree on', () => {
    expect(IngredientLine.heading()).toBe('# ');
    expect(IngredientLine.heading('Şerbet')).toBe('# Şerbet');
    expect(IngredientLine.of(IngredientLine.heading('Şerbet')).groupLabel).toBe('Şerbet');
  });
});

describe('RecipeServings', () => {
  const servings = (count: number): RecipeServings => {
    const result = RecipeServings.create(count);
    if (!result.ok) throw new Error(result.failure.message);
    return result.value;
  };

  it.each([0, -2, 1.5, Number.NaN])('refuses %p', (count) => {
    expect(RecipeServings.create(count).ok).toBe(false);
  });

  it('steps by one person and stops at the recipe limits', () => {
    expect(servings(4).increment().value).toBe(5);
    expect(servings(4).decrement().value).toBe(3);
    expect(servings(RecipeLimits.servingsMin).decrement().value).toBe(RecipeLimits.servingsMin);
    expect(servings(RecipeLimits.servingsMax).increment().value).toBe(RecipeLimits.servingsMax);
    expect(servings(RecipeLimits.servingsMin).canDecrement).toBe(false);
  });

  it('gives the factor every amount is multiplied by', () => {
    expect(servings(6).factorFrom(servings(4))).toBe(1.5);
  });
});
