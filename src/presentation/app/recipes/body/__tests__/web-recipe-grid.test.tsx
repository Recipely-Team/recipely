/**
 * Behavior tests for the web recipe grid's loading branch.
 *
 * The regression under test: a sort/filter change must NOT blank the page. The
 * grid keeps its section head (title + sort/filter controls) mounted and shows
 * shimmer cards in the grid area while `isLoading` — instead of collapsing to
 * the empty state or unmounting. With an empty `recipes` list we can assert the
 * branch purely from rendered text, without rendering real recipe cards (which
 * would pull in author/store data).
 *
 * Icons are stubbed to plain text so query helpers don't trip on the native mock.
 */

import {
  renderComponent,
  textContent,
  allByTestId,
} from '@presentation/base/test-support/render-component';
import type { RenderResult } from '@presentation/base/test-support/render-result';
import { WebRecipeGrid } from '@presentation/app/recipes/body/web-recipe-grid';
import type { WebRecipeGridProps } from '@presentation/app/recipes/body/web-recipe-grid';
import { t } from '@presentation/i18n';

jest.mock('@expo/vector-icons', () => {
  const { Text } = jest.requireActual<typeof import('react-native')>('react-native');
  const Icon = (props: { name: string }): React.JSX.Element => <Text>{`icon:${props.name}`}</Text>;
  return { Ionicons: Icon, MaterialCommunityIcons: Icon };
});

// The real SkeletonCard runs an infinite shimmer animation whose timer leaks
// past the test. We only assert that shimmer (not the empty state) is shown
// while loading, so a static stand-in is enough.
jest.mock('@presentation/base/widgets/cards/skeleton-card', () => {
  const { Text } = jest.requireActual<typeof import('react-native')>('react-native');
  return { SkeletonCard: (): React.JSX.Element => <Text>skeleton-card</Text> };
});

const baseProps: WebRecipeGridProps = {
  recipes: [],
  isSearching: false,
  activeCuisineLabel: null,
  sortBy: 'popular',
  onChangeSort: jest.fn(),
  onOpenFilter: jest.fn(),
  activeFilterCount: 0,
  activeDifficulty: null,
  onDifficultyChange: jest.fn(),
  gridColumns: 3,
  isLoading: false,
  isRefreshing: false,
  onOpenRecipe: jest.fn(),
  isSaved: () => false,
  onToggleSave: jest.fn(),
};

const renderGrid = (overrides: Partial<WebRecipeGridProps> = {}): RenderResult =>
  renderComponent(<WebRecipeGrid {...baseProps} {...overrides} />);

describe('WebRecipeGrid — loading', () => {
  it('keeps the section head title and hides the empty state while loading', () => {
    const texts = textContent(renderGrid({ isLoading: true }).root);

    // Page chrome stays mounted…
    expect(texts).toContain(t().recipes.webAllRecipes);
    // …the grid shimmers…
    expect(texts).toContain('skeleton-card');
    // …instead of showing the empty state.
    expect(texts).not.toContain(t().recipes.webEmptyBody);
    expect(texts).not.toContain(t().recipes.noResults);
  });

  it('shows the empty state (not shimmer) when not loading with zero results', () => {
    const texts = textContent(renderGrid({ isLoading: false }).root);

    expect(texts).toContain(t().recipes.webAllRecipes);
    expect(texts).toContain(t().recipes.noResults);
    expect(texts).toContain(t().recipes.webEmptyBody);
  });
});

describe('WebRecipeGrid — background refresh indicator', () => {
  it('shows a subtle inline spinner (not the full skeleton) while refreshing an already-loaded list', () => {
    const { root } = renderGrid({ isLoading: false, isRefreshing: true });

    // `ActivityIndicator` forwards `testID` to more than one internal node, so
    // assert presence rather than an exact count.
    expect(allByTestId(root, 'web-recipe-grid-refresh-indicator').length).toBeGreaterThan(0);
    // Section head + (empty-state) chrome stay mounted — no shimmer replaces them.
    expect(textContent(root)).not.toContain('skeleton-card');
    expect(textContent(root)).toContain(t().recipes.webAllRecipes);
  });

  it('hides the spinner when not refreshing', () => {
    const { root } = renderGrid({ isRefreshing: false });

    expect(allByTestId(root, 'web-recipe-grid-refresh-indicator')).toHaveLength(0);
  });
});
