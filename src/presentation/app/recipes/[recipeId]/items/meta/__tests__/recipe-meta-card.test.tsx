/**
 * The phone's stat tiles, as the prototype draws them.
 *
 * Two things were wrong on a phone before this: the difficulty tile printed the
 * wire value ("EASY") where the web sidebar already said "Easy", and every
 * label was held to one line, so a quarter of a 320pt card cut "PREPARATION"
 * down to an ellipsis.
 */
import { act } from 'react-test-renderer';
import { StyleSheet, Text, type ViewStyle } from 'react-native';
import type { ReactTestInstance } from 'react-test-renderer';
import { renderComponent, textContent } from '@presentation/base/test-support/render-component';
import { RecipeMetaCard, type RecipeMetaCardProps } from '@presentation/app/recipes/[recipeId]/items/meta/recipe-meta-card';
import { statGrid } from '@presentation/app/recipes/[recipeId]/model/meta/stat-grid';
import { statCellWidths } from '@presentation/app/recipes/[recipeId]/model/meta/stat-cell-widths';
import { Difficulty } from '@domain/recipes/difficulty';
import { t } from '@presentation/i18n';
import { upperCase } from '@presentation/i18n/upper-case';

const PROPS: RecipeMetaCardProps = {
  prepTimeMinutes: 15,
  cookTimeMinutes: 40,
  servings: 4,
  difficulty: Difficulty.Easy,
  recipeId: 'r1',
  recipeName: 'Menemen',
};
const FRAME = { border: 1.5, gap: 1 };

/** The innermost node carrying the card's `onLayout` — the host view whose children are the cells. */
const cardOf = (root: ReactTestInstance): ReactTestInstance => {
  const card = root.findAll((n) => typeof n.props['onLayout'] === 'function').at(-1);
  if (card === undefined) throw new Error('no measured card');
  return card;
};

const layOut = (root: ReactTestInstance, width: number): void => {
  const card = cardOf(root);
  act(() => {
    (card.props['onLayout'] as (e: { nativeEvent: { layout: { width: number } } }) => void)({
      nativeEvent: { layout: { width } },
    });
  });
};

const cellWidths = (root: ReactTestInstance): number[] => {
  return cardOf(root).children
    .filter((child): child is ReactTestInstance => typeof child !== 'string')
    .map((cell) => Number(StyleSheet.flatten(cell.props['style'] as ViewStyle).width));
};

describe('RecipeMetaCard', () => {
  it('difficulty showed untranslated EASY on the phone detail', () => {
    const { root } = renderComponent(<RecipeMetaCard {...PROPS} />);
    const texts = textContent(root);
    expect(texts).toContain(t().recipes.difficultyEasy);
    expect(texts).not.toContain(Difficulty.Easy);
  });

  it('stat labels were truncated on a phone', () => {
    const { root } = renderComponent(<RecipeMetaCard {...PROPS} />);
    const labels = [t().recipes.prepShort, t().recipes.cookShort, t().recipes.servings, t().recipes.difficulty].map(upperCase);
    const labelNodes = root.findAllByType(Text).filter((n) => labels.includes(String(n.props['children'])));

    expect(labelNodes).toHaveLength(labels.length);
    for (const node of labelNodes) expect(node.props['numberOfLines']).toBeUndefined();
  });

  it('writes minutes in the localized short unit', () => {
    const { root } = renderComponent(<RecipeMetaCard {...PROPS} />);
    expect(textContent(root)).toContain(`15 ${t().recipes.minutes}`);
  });

  it('folds four tiles into two columns on a card no wider than the breakpoint', () => {
    const { root } = renderComponent(<RecipeMetaCard {...PROPS} />);
    layOut(root, statGrid.narrowMaxWidth);
    const widths = cellWidths(root);
    expect(widths).toHaveLength(4);
    expect(widths.every((w) => w > statGrid.narrowMaxWidth / 3)).toBe(true);
  });

  it('keeps every tile in one row above the breakpoint', () => {
    const { root } = renderComponent(<RecipeMetaCard {...PROPS} />);
    layOut(root, statGrid.narrowMaxWidth + 1);
    const widths = cellWidths(root);
    expect(widths).toHaveLength(4);
    expect(widths.every((w) => w < (statGrid.narrowMaxWidth + 1) / 3)).toBe(true);
  });
});

describe('statCellWidths', () => {
  it('waits for a measurement before sizing anything', () => {
    expect(statCellWidths(0, 4, FRAME)).toBeNull();
  });

  it('lets an odd tile out span the whole row, and never overflows a row', () => {
    const widths = statCellWidths(300, 3, FRAME) ?? [];
    const inner = 300 - FRAME.border * 2;
    expect(widths[2]).toBe(inner);
    expect((widths[0] ?? 0) + (widths[1] ?? 0) + FRAME.gap).toBeLessThanOrEqual(inner);
  });

  it('keeps two tiles side by side on a narrow card', () => {
    const widths = statCellWidths(300, 2, FRAME) ?? [];
    expect(widths[0]).toBe(widths[1]);
  });
});
