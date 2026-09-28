import { act } from 'react-test-renderer';
import type { ReactTestInstance } from 'react-test-renderer';
import { NutritionFacts } from '@domain/recipes/nutrition/nutrition-facts';
import type { RecipeNutrition } from '@domain/recipes/recipe-nutrition';
import { NutritionPanel } from '@presentation/app/recipes/[recipeId]/items/nutrition/nutrition-panel';
import { renderComponent, textContent } from '@presentation/base/test-support/render-component';
import { t } from '@presentation/i18n';

const factsOf = (caloriesPerServing: number, nutrition: RecipeNutrition | undefined): NutritionFacts =>
  NutritionFacts.of({ caloriesPerServing, servings: 4, nutrition });

const radios = (root: ReactTestInstance): ReactTestInstance[] =>
  root.findAll((node) => node.props.accessibilityRole === 'radio' && typeof node.props.onPress === 'function');

describe('NutritionPanel — basis switch', () => {
  const nutrition = { protein: 24, carbs: 60, fat: 18, fiber: 6, servingWeightGrams: 400 };

  it('opens per 100 g and switches to per serving when the serving option is chosen', () => {
    const { root } = renderComponent(<NutritionPanel facts={factsOf(520, nutrition)} isCalculating={false} />);

    // 520 kcal per 400 g serving → 130 kcal per 100 g; 60 g carbs → 15 g.
    expect(textContent(root)).toEqual(expect.arrayContaining(['130', '15', t().nutrition.per100]));

    const press: unknown = radios(root)[1]?.props.onPress;
    if (typeof press !== 'function') throw new Error('no serving option');
    act(() => press());

    expect(textContent(root)).toEqual(expect.arrayContaining(['520', '60', t().nutrition.perServing]));
    expect(textContent(root)).not.toContain('130');
    expect(radios(root)[1]?.props.accessibilityState).toEqual({ checked: true });
  });
});

describe('NutritionPanel — no serving weight', () => {
  it('offers no switch and explains why per 100 g is missing', () => {
    const { root } = renderComponent(
      <NutritionPanel facts={factsOf(520, { protein: 24 })} isCalculating={false} />,
    );

    expect(radios(root)).toHaveLength(0);
    expect(textContent(root)).toContain(t().nutrition.noWeight);
    expect(textContent(root)).toContain('520');
  });

  it('shows the note nowhere when the weight is known', () => {
    const { root } = renderComponent(
      <NutritionPanel facts={factsOf(520, { protein: 24, servingWeightGrams: 300 })} isCalculating={false} />,
    );

    expect(textContent(root)).not.toContain(t().nutrition.noWeight);
  });
});

/**
 * Reported as "besin değerleri gözükmüyor". The API sends `0` both for "measured
 * as zero" and for "never filled in"; a silently absent section read as a
 * broken screen, and "0 g" asserted a fact the backend never sent.
 */
describe('NutritionPanel — absent figures', () => {
  it('says so explicitly when the recipe carries no nutrition at all', () => {
    const { root } = renderComponent(<NutritionPanel facts={factsOf(0, undefined)} isCalculating={false} />);

    expect(textContent(root)).toContain(t().nutrition.unavailable);
  });

  it('says the figures are coming while the backend is still computing them', () => {
    const { root } = renderComponent(<NutritionPanel facts={factsOf(0, undefined)} isCalculating />);

    expect(textContent(root)).toContain(t().nutrition.calculating);
  });

  it('treats an all-zero nutrition object as absent, not as measured zeroes', () => {
    const { root } = renderComponent(
      <NutritionPanel facts={factsOf(0, { protein: 0, carbs: 0, fat: 0, fiber: 0 })} isCalculating={false} />,
    );

    expect(textContent(root)).toContain(t().nutrition.unavailable);
  });

  it('leaves unreported macros out of the grid instead of printing 0 g', () => {
    const { root } = renderComponent(
      <NutritionPanel facts={factsOf(350, { protein: 12, fat: 0 })} isCalculating={false} />,
    );

    const texts = textContent(root);
    expect(texts).toContain(t().nutrition.protein);
    expect(texts).not.toContain(t().nutrition.fat);
    expect(texts).not.toContain('0');
  });
});
