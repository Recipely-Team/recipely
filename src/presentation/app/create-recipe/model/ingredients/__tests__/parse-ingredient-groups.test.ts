/**
 * The editor draws cards; the recipe is still a flat `string[]` with `# Label`
 * headings in it. This is the only place that knows both, so it is the only
 * place the two can disagree.
 *
 * The index carried on every item is the load-bearing part: an edit, a delete
 * and a reorder are all written straight back to the flat array by it. A parse
 * that renumbered or dropped an index would corrupt the recipe silently — the
 * user would edit one ingredient and watch another change.
 */

import { parseIngredientGroups } from '@presentation/app/create-recipe/model/ingredients/parse-ingredient-groups';

describe('parseIngredientGroups', () => {
  it('returns one ungrouped run for a recipe with no headings — the common case', () => {
    const groups = parseIngredientGroups(['2 eggs', 'flour']);

    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({ label: null, headerIndex: -1 });
    expect(groups[0]?.items.map((i) => i.value)).toEqual(['2 eggs', 'flour']);
  });

  it('keeps every item pointing at its own slot in the flat array', () => {
    const groups = parseIngredientGroups(['2 eggs', '# For the syrup', 'sugar', 'water']);

    expect(groups[0]?.items).toEqual([{ value: '2 eggs', index: 0 }]);
    expect(groups[1]?.items).toEqual([
      { value: 'sugar', index: 2 },
      { value: 'water', index: 3 },
    ]);
    // The heading's own index is what a rename or a group delete writes to.
    expect(groups[1]?.headerIndex).toBe(1);
  });

  it('reads the heading text without its marker', () => {
    expect(parseIngredientGroups(['# For the syrup'])[0]?.label).toBe('For the syrup');
  });

  it('drops the empty ungrouped run when the recipe opens with a heading', () => {
    // Otherwise the editor renders a stray empty block above the first card.
    const groups = parseIngredientGroups(['# Dough', 'flour']);

    expect(groups).toHaveLength(1);
    expect(groups[0]?.label).toBe('Dough');
  });

  it('keeps the ungrouped run when it has items, even with groups after it', () => {
    const groups = parseIngredientGroups(['salt', '# Dough', 'flour']);

    expect(groups.map((g) => g.label)).toEqual([null, 'Dough']);
  });

  it('represents a heading with nothing under it as an empty group', () => {
    // "Add group" creates the heading first; the card must render before the
    // user has typed a single ingredient into it.
    const groups = parseIngredientGroups(['# ']);

    expect(groups).toHaveLength(1);
    expect(groups[0]?.items).toEqual([]);
    expect(groups[0]?.label).toBe('');
  });

  it('handles an empty recipe without inventing a group', () => {
    const groups = parseIngredientGroups([]);

    expect(groups).toHaveLength(1);
    expect(groups[0]?.items).toEqual([]);
    expect(groups[0]?.headerIndex).toBe(-1);
  });

  it('keeps consecutive headings apart', () => {
    const groups = parseIngredientGroups(['# Dough', '# Filling', 'jam']);

    expect(groups.map((g) => g.label)).toEqual(['Dough', 'Filling']);
    expect(groups[0]?.items).toEqual([]);
    expect(groups[1]?.items).toEqual([{ value: 'jam', index: 2 }]);
  });
});
