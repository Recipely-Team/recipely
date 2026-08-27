/**
 * `RecipeSearchOverlay` is the mobile dedicated search-results surface that
 * `recipe-list-screen` swaps in for its whole body while `isSearching` — see
 * that screen's body-branch comment. These tests cover its own discriminated
 * states (zero-results empty state vs. a populated result list) in isolation.
 *
 * `RecipeListItem` is mocked to a plain row so this suite doesn't have to pull
 * in its store dependencies (likes/auth) — same convention as
 * `web-recipe-grid.test.tsx`'s `SkeletonCard` stub.
 */

import { renderComponent, textContent } from '@presentation/base/test-support/render-component';
import { RecipeSearchOverlay } from '@presentation/app/recipes/sheets/recipe-search-overlay';
import { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';
import { t } from '@presentation/i18n';

jest.mock('@expo/vector-icons', () => {
  const { Text } = jest.requireActual<typeof import('react-native')>('react-native');
  const Icon = (props: { name: string }): React.JSX.Element => <Text>{`icon:${props.name}`}</Text>;
  return { Ionicons: Icon, MaterialCommunityIcons: Icon };
});

jest.mock('@presentation/app/recipes/items/cards/recipe-list-item', () => {
  const { Text, Pressable } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    RecipeListItem: ({
      recipe,
      onPress,
    }: {
      recipe: { id: string; name: string };
      onPress: () => void;
    }): React.JSX.Element => (
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={recipe.name}>
        <Text>{recipe.name}</Text>
      </Pressable>
    ),
  };
});

const buildRecipe = (id: string, name: string): RecipeSummaryEntity => {
  const result = RecipeSummaryEntity.create({
    id,
    name,
    image: '',
    cuisine: 'ITALIAN',
    category: 'MAIN',
    difficulty: 'EASY',
    totalTimeMinutes: 20,
    rating: 4.2,
    moderationStatus: 'approved',
    likeCount: 0,
    likedByMe: false,
    commentCount: 0,
    viewCount: 0,
  });
  if (!result.ok) throw new Error('fixture invalid');
  return result.value;
};

describe('RecipeSearchOverlay', () => {
  it('shows the zero-results empty state when the backend returned no matches', () => {
    const { root } = renderComponent(
      <RecipeSearchOverlay recipes={[]} isLoading={false} onOpenRecipe={jest.fn()} attachList={jest.fn()} />,
    );

    const texts = textContent(root);
    expect(texts).toContain(t().recipes.noResults);
    expect(texts).toContain(`0 ${t().recipes.results}`);
  });

  it('renders the result count and every matching recipe row when results exist', () => {
    const recipes = [buildRecipe('r1', 'Search Pasta'), buildRecipe('r2', 'Search Salad')];
    const { root } = renderComponent(
      <RecipeSearchOverlay recipes={recipes} isLoading={false} onOpenRecipe={jest.fn()} attachList={jest.fn()} />,
    );

    const texts = textContent(root);
    expect(texts).toContain(`2 ${t().recipes.results}`);
    expect(texts).toContain('Search Pasta');
    expect(texts).toContain('Search Salad');
    expect(texts).not.toContain(t().recipes.noResults);
  });

  it('opens the tapped recipe', () => {
    const recipes = [buildRecipe('r1', 'Search Pasta')];
    const onOpenRecipe = jest.fn();
    const { root } = renderComponent(
      <RecipeSearchOverlay recipes={recipes} isLoading={false} onOpenRecipe={onOpenRecipe} attachList={jest.fn()} />,
    );

    const row = root.find(
      (node) => node.props.accessibilityRole === 'button' && node.props.accessibilityLabel === 'Search Pasta',
    );
    (row.props.onPress as () => void)();

    expect(onOpenRecipe).toHaveBeenCalledWith('r1');
  });

  /**
   * Search became a backend filter, which put a gap between the keystroke and
   * the answer (debounce + request). During that gap `recipes` still holds the
   * PREVIOUS query's results, so the empty state must be suppressed — otherwise
   * every query that starts by narrowing to zero flashes "no matches" at a user
   * who is still typing a perfectly good search.
   */
  describe('while the typed query is unanswered', () => {
    it('suppresses the no-results copy instead of accusing the query of failing', () => {
      const { root } = renderComponent(
        <RecipeSearchOverlay recipes={[]} isLoading onOpenRecipe={jest.fn()} attachList={jest.fn()} />,
      );

      expect(textContent(root)).not.toContain(t().recipes.noResults);
    });

    it('replaces the stale result count with the refreshing label', () => {
      const recipes = [buildRecipe('r1', 'Search Pasta')];
      const { root } = renderComponent(
        <RecipeSearchOverlay recipes={recipes} isLoading onOpenRecipe={jest.fn()} attachList={jest.fn()} />,
      );

      const texts = textContent(root);
      expect(texts).toContain(t().recipes.refreshing);
      // The count belongs to the previous query; showing it would claim the new
      // one has already been answered.
      expect(texts).not.toContain(`1 ${t().recipes.results}`);
    });

    it('keeps the previous rows visible rather than blanking the list', () => {
      const recipes = [buildRecipe('r1', 'Search Pasta')];
      const { root } = renderComponent(
        <RecipeSearchOverlay recipes={recipes} isLoading onOpenRecipe={jest.fn()} attachList={jest.fn()} />,
      );

      // Stale-while-revalidate: emptying the list on every keystroke would make
      // the surface flicker between results and a spinner as the user types.
      expect(textContent(root)).toContain('Search Pasta');
    });
  });

  // While search results are up they REPLACE the browse list, so they are the
  // page — and the feed held no reference to them, which is why "aşağı kaydır"
  // in a search did nothing while reporting success.
  it('attaches its results list to the feed scroll handle', () => {
    const attachList = jest.fn();
    renderComponent(
      <RecipeSearchOverlay
        recipes={[buildRecipe('r1', 'Search Pasta')]}
        isLoading={false}
        onOpenRecipe={jest.fn()}
        attachList={attachList}
      />,
    );

    expect(attachList).toHaveBeenCalled();
    expect(attachList.mock.calls[0][0]).not.toBeNull();
  });
});
