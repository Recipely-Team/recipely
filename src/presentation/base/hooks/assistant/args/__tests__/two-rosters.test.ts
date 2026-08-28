import { recipeRoster } from '@presentation/base/hooks/assistant/args/recipe-roster';
import { rowAt } from '@presentation/base/hooks/assistant/args/row-at';
import { SCREEN_PART_SEPARATOR } from '@presentation/base/hooks/assistant/args/screen-line';

/**
 * "Bu hafta öne çıkanlardan üçüncüsüne gir" opened a recipe from the grid
 * underneath. The hero reads its own store, so its three recipes were never on
 * the screen line — the model counted into the only list it had been given.
 */
const HERO = ['Fıstıklı Baklava', 'Fırın Lazanya', '15 Dakikada Peynirli Poğaça'];
const GRID = ['Fırın Lazanya', 'Cevizli Pekan Turtası', 'Ballı Teriyaki Somon'];

describe('a feed carrying two lists', () => {
  it('names them separately, so the model can tell which was meant', () => {
    const line = [recipeRoster('featured', HERO), recipeRoster('recipes', GRID)].join(
      SCREEN_PART_SEPARATOR,
    );

    expect(line).toContain('featured=1) Fıstıklı Baklava');
    expect(line).toContain('3) 15 Dakikada Peynirli Poğaça');
    expect(line).toContain('recipes=1) Fırın Lazanya');
  });

  // The grid comes first in the action rows, so a bare position still counts
  // into it — that is what "the second one" means nine times in ten.
  it('counts a bare position into the grid', () => {
    const rows = [...GRID, ...HERO];

    expect(rowAt(rows, '2')).toBe(1);
    expect(rows[rowAt(rows, '2') ?? -1]).toBe('Cevizli Pekan Turtası');
  });

  it('still resolves a hero recipe by the name the model read off the line', () => {
    const rows = [...GRID, ...HERO];
    const at = rowAt(rows, 'Peynirli Poğaça');

    expect(at).not.toBeNull();
    expect(rows[at ?? -1]).toBe('15 Dakikada Peynirli Poğaça');
  });

  it('says so plainly when the hero is not on screen', () => {
    expect(recipeRoster('recipes', [])).toContain('recipes=');
  });
});
