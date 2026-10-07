/**
 * The symptom: "Besin değerleri" appeared twice on the mobile recipe detail —
 * once as the screen's section header, then again as the nutrition card's own
 * title directly under it. Two components each thought they owned the heading.
 *
 * The panel now carries no title; the section header is the only one.
 */

/* eslint-disable import/first -- jest.mock() must be hoisted above imports */

// "Add to diary" carries its own sheet and reads the auth and diary stores; not under test here.
jest.mock('@presentation/app/recipes/[recipeId]/items/diary/add-to-diary-button', () => ({
  AddToDiaryButton: () => null,
}));

// The meta card starts cook timers through the timer store, and the caption
// row words the cuisine through the taxonomy store; neither is under test.
jest.mock('@presentation/app/recipes/[recipeId]/items/meta/recipe-meta-card', () => ({
  RecipeMetaCard: () => null,
}));
jest.mock('@presentation/base/taxonomy/use-taxonomy-label', () => ({
  useTaxonomyLabel: () => ({ cuisineLabel: (key: string) => ({ name: key }) }),
}));

import { portionScalingFixture } from '@presentation/app/recipes/[recipeId]/model/portions/__fixtures__/portion-scaling-fixture';
import { StoreStatus } from '@application/store/store-status';
import { recipeEntityOf } from '@application/__fixtures__/recipe-entity-of';
import { RecipeOverview } from '@presentation/app/recipes/[recipeId]/body/recipe-overview';
import { renderComponent, textContent } from '@presentation/base/test-support/render-component';
import { t } from '@presentation/i18n';
import { upperCase } from '@presentation/i18n/upper-case';

describe('RecipeOverview — nutrition heading', () => {
  it('names the nutrition section exactly once', () => {
    const recipe = recipeEntityOf({ nutrition: { protein: 20, carbs: 40, fat: 10, servingWeightGrams: 300 } });

    const { root } = renderComponent(
      <RecipeOverview
        recipe={recipe}
        recipeId={recipe.id}
        liked={false}
        likeCount={0}
        commentTotal={0}
        authorState={{ status: StoreStatus.Unavailable }}
        onToggleLike={jest.fn()}
        isNutritionCalculating={false}
        photos={undefined}
        portions={portionScalingFixture()}
      />,
    );

    const headings = [t().recipes.nutrition, t().nutrition.title].flatMap((title) => [title, upperCase(title)]);
    expect(textContent(root).filter((text) => headings.includes(text))).toHaveLength(1);
  });
});
