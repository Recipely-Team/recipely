/**
 * Fiber must render as a single combined "Fiber: 11g" string (right-aligned),
 * not as a separate label/value pair split across the row — matches the
 * boxed-tile styling of the other macros instead of looking inconsistent.
 */

import { renderComponent, textContent } from '@presentation/base/test-support/render-component';
import { NutritionCard } from '@presentation/app/recipes/[recipeId]/items/nutrition/nutrition-card';
import { t } from '@presentation/i18n';
import { CharConstants } from '@core/constants';

describe('NutritionCard — fiber row', () => {
  it('renders fiber as a single combined "Fiber: {value}g" string', () => {
    const { root } = renderComponent(
      <NutritionCard
        caloriesPerServing={320}
        servings={2}
        nutrition={{ protein: 10, carbs: 40, fat: 8, fiber: 11 }}
      />,
    );

    const expected = t().nutrition.fiberValue.replace('{value}', '11');
    const texts = textContent(root);
    expect(texts).toContain(expected);
    // Not split across the row as a bare label and a bare value.
    expect(texts).not.toContain(t().nutrition.fiber);
    expect(texts).not.toContain('11g');
  });

  it('omits the fiber row entirely when fiber is zero/absent', () => {
    const { root } = renderComponent(
      <NutritionCard
        caloriesPerServing={320}
        servings={2}
        nutrition={{ protein: 10, carbs: 40, fat: 8, fiber: 0 }}
      />,
    );

    const texts = textContent(root);
    expect(texts.some((text) => text.includes(t().nutrition.fiber))).toBe(false);
  });
});

/**
 * Reported as "besin değerleri gözükmüyor". The API sends `0` both for "measured
 * as zero" and for "never filled in", and an audit of the live catalogue found
 * 3 of 30 recipes with no nutrition at all plus 2 more with calories but every
 * macro at 0. The card used to return `null` on the former — a silently absent
 * section is indistinguishable from a broken screen — and print "0 g" for the
 * latter, which asserts a nutritional fact the backend never sent.
 */
describe('NutritionCard — absent figures', () => {
  it('says so explicitly when the recipe carries no nutrition at all', () => {
    const { root } = renderComponent(
      <NutritionCard caloriesPerServing={0} servings={4} nutrition={undefined} />,
    );

    const texts = textContent(root);
    expect(texts).toContain(t().nutrition.unavailable);
    // The heading stays so the section is visibly present, not dropped.
    expect(texts).toContain(t().nutrition.title);
  });

  it('treats an all-zero nutrition object as absent, not as measured zeroes', () => {
    const { root } = renderComponent(
      <NutritionCard
        caloriesPerServing={0}
        servings={4}
        nutrition={{ protein: 0, carbs: 0, fat: 0, fiber: 0 }}
      />,
    );

    expect(textContent(root)).toContain(t().nutrition.unavailable);
  });

  it('shows an em dash per missing macro when calories came through alone', () => {
    // The exact live shape of "Bol Kakaolu Kek": 350 kcal, every macro absent.
    const { root } = renderComponent(
      <NutritionCard caloriesPerServing={350} servings={4} nutrition={undefined} />,
    );

    const texts = textContent(root);
    expect(texts).toContain('350');
    expect(texts).not.toContain(t().nutrition.unavailable);
    // Three dashes: protein, carbs, fat. Never "0".
    expect(texts.filter((text) => text === CharConstants.emDash)).toHaveLength(3);
    expect(texts).not.toContain('0');
  });

  it('drops the unit alongside a dashed value', () => {
    const { root } = renderComponent(
      <NutritionCard caloriesPerServing={350} servings={4} nutrition={{ protein: 12 }} />,
    );

    const texts = textContent(root);
    // Only the one reported macro carries a "g"; "— g" would still read as a
    // measured quantity.
    expect(texts.filter((text) => text === t().nutrition.g)).toHaveLength(1);
  });
});
