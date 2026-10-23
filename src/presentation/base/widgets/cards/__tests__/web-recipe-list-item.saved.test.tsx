/**
 * The card reads its own recipe's saved flag from the store, so the bookmark
 * follows a save made anywhere without the list passing it down.
 */
import { act } from 'react-test-renderer';
import { create } from 'zustand';
import { WebRecipeListItem } from '@presentation/base/widgets/cards/web-recipe-list-item';
import { renderComponent } from '@presentation/base/test-support/render-component';
import type { ApplicationStores } from '@application/di/application-stores';
import { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';
import { CuisineKey } from '@domain/recipes/taxonomy/cuisine-key';
import { RecipeCategory } from '@domain/recipes/taxonomy/recipe-category';
import { Difficulty } from '@domain/recipes/difficulty';
import { RecipeOrigin } from '@domain/recipes/provenance/recipe-origin';
import { t } from '@presentation/i18n';

const recipe = (() => {
  const result = RecipeSummaryEntity.create({
    photoCount: 0,
    id: 'r1',
    name: 'Recipe r1',
    image: 'https://cdn.example.com/r1.webp',
    cuisine: CuisineKey.Italian,
    category: RecipeCategory.Dinner,
    difficulty: Difficulty.Easy,
    totalTimeMinutes: 30,
    rating: 4.5,
    moderationStatus: 'approved',
    isPublished: true,
    likeCount: 0,
    likedByMe: false,
    commentCount: 0,
    viewCount: 0,
    origin: RecipeOrigin.User,
    sourcePlatform: null,
    aiWritten: false,
  });
  if (!result.ok) throw new Error('failed to build RecipeSummaryEntity fixture');
  return result.value;
})();

it('shows the bookmark as saved once the recipe enters the saved set, and not before', () => {
  const savedRecipesStore = create(() => ({ savedIds: new Set<string>() }));
  const { root } = renderComponent(
    <WebRecipeListItem recipe={recipe} onOpen={jest.fn()} onToggleSave={jest.fn()} />,
    {
      savedRecipesStore,
      likesStore: create(() => ({ byRecipe: {}, seed: jest.fn() })),
      taxonomyStore: create(() => ({ cuisines: [], categories: [], status: 'idle', failure: null })),
    } as unknown as Partial<ApplicationStores>,
  );
  const bookmarkLabels = (): unknown[] =>
    root
      .findAll((node) => node.props.accessibilityRole === 'button')
      .map((node) => node.props.accessibilityLabel)
      .filter((label) => label === t().recipes.save || label === t().recipes.saved);

  expect(bookmarkLabels()).toContain(t().recipes.save);

  act(() => savedRecipesStore.setState({ savedIds: new Set(['r1']) }));

  expect(bookmarkLabels()).toContain(t().recipes.saved);
  expect(bookmarkLabels()).not.toContain(t().recipes.save);
});
