/**
 * Fiber must render as a single combined "Fiber: 11g" string (right-aligned),
 * not as a separate label/value pair split across the row — matches the
 * boxed-tile styling of the other macros instead of looking inconsistent.
 */

import { renderComponent, textContent } from '@presentation/base/test-support/render-component';
import { NutritionCard } from '@presentation/app/recipes/[recipeId]/items/nutrition/nutrition-card';
import { t } from '@presentation/i18n';

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
