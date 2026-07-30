import { isIngredientGroup } from '@domain/recipes/ingredients/is-ingredient-group';
import { ingredientGroupLabel } from '@domain/recipes/ingredients/ingredient-group-label';

/**
 * Group headings ride inside the ingredient `string[]` marked by a leading `#`,
 * so every consumer has to be able to tell one from an ingredient. These pin
 * the marker's edges: what counts, what does not, and what the heading reads as.
 */

describe('isIngredientGroup', () => {
  it('recognises a heading', () => {
    expect(isIngredientGroup('# Şerbet')).toBe(true);
  });

  it('recognises one written without a space', () => {
    expect(isIngredientGroup('#Şerbet')).toBe(true);
  });

  it('tolerates leading whitespace, which the editor can leave behind', () => {
    expect(isIngredientGroup('  # Şerbet')).toBe(true);
  });

  it('recognises the bare marker the editor creates before it is named', () => {
    expect(isIngredientGroup('# ')).toBe(true);
  });

  it('does not treat an ingredient as a heading', () => {
    expect(isIngredientGroup('2 su bardağı şeker')).toBe(false);
  });

  it('does not fire on a # that is not at the start', () => {
    // "no. 5" style quantities and hashtags in a name must stay ingredients.
    expect(isIngredientGroup('Un #1 kalite')).toBe(false);
  });

  it('does not fire on an empty line', () => {
    expect(isIngredientGroup('')).toBe(false);
  });
});

describe('ingredientGroupLabel', () => {
  it('strips the marker and the space after it', () => {
    expect(ingredientGroupLabel('# Şerbet')).toBe('Şerbet');
  });

  it('strips a marker written without a space', () => {
    expect(ingredientGroupLabel('#Şerbet')).toBe('Şerbet');
  });

  it('strips repeated markers rather than leaving one behind', () => {
    expect(ingredientGroupLabel('## Şerbet')).toBe('Şerbet');
  });

  it('is empty for a heading that has not been named', () => {
    expect(ingredientGroupLabel('# ')).toBe('');
  });

  it('keeps a # that belongs to the heading text', () => {
    expect(ingredientGroupLabel('# Kat #2')).toBe('Kat #2');
  });
});
