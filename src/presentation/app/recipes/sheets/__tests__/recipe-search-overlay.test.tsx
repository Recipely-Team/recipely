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
  it('shows the zero-results empty state when the filtered list is empty', () => {
    const { root } = renderComponent(
      <RecipeSearchOverlay recipes={[]} onOpenRecipe={jest.fn()} />,
    );

    const texts = textContent(root);
    expect(texts).toContain(t().recipes.noResults);
    expect(texts).toContain(`0 ${t().recipes.results}`);
  });

  it('renders the result count and every matching recipe row when results exist', () => {
    const recipes = [buildRecipe('r1', 'Search Pasta'), buildRecipe('r2', 'Search Salad')];
    const { root } = renderComponent(
      <RecipeSearchOverlay recipes={recipes} onOpenRecipe={jest.fn()} />,
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
      <RecipeSearchOverlay recipes={recipes} onOpenRecipe={onOpenRecipe} />,
    );

    const row = root.find(
      (node) => node.props.accessibilityRole === 'button' && node.props.accessibilityLabel === 'Search Pasta',
    );
    (row.props.onPress as () => void)();

    expect(onOpenRecipe).toHaveBeenCalledWith('r1');
  });
});
