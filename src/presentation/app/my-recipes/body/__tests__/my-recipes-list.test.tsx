/**
 * Wiring tests for the `RefreshControl` in `MyRecipesList`.
 *
 * `use-my-recipes-refresh.test.tsx` pins the hook's `isRefreshing` flag; this
 * suite pins the prop wiring, and above all the branch that was the real gap:
 * the EMPTY states. A plain `View` accepts no pull gesture, so an empty Saved /
 * Created / Drafts tab — exactly when a user reaches for a refresh — has to
 * render a scrollable surface carrying the control, not just a centred icon.
 *
 * `@expo/vector-icons` is stubbed (it renders a font-backed glyph this wiring
 * doesn't touch), matching the sibling `recipe-list-body.test.tsx`. Everything
 * else renders through production code: `RecipeCard` and `DraftCard` read only
 * theme + i18n, so the real components keep the branches honest.
 */

import { act } from 'react-test-renderer';
import { FlatList, RefreshControl, ScrollView } from 'react-native';
import type { ReactTestInstance } from 'react-test-renderer';
import { renderComponent, textContent, allByTestId } from '@presentation/base/test-support/render-component';
import { t } from '@presentation/i18n';
import { MyRecipesList } from '@presentation/app/my-recipes/body/my-recipes-list';
import { MY_RECIPES_SKELETON_TEST_ID } from '@presentation/app/my-recipes/body/my-recipes-skeleton';
import type { MyRecipesListProps } from '@presentation/app/my-recipes/body/my-recipes-list';
import { TabType } from '@presentation/app/my-recipes/model/tab-type';
import { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';
import { NetworkFailure } from '@core/failure';
import { CuisineKey } from '@domain/recipes/taxonomy/cuisine-key';
import { RecipeCategory } from '@domain/recipes/taxonomy/recipe-category';
import { Difficulty } from '@domain/recipes/difficulty';
import type { RecipeDraft } from '@domain/drafts/recipe-draft';

jest.mock('@expo/vector-icons', () => {
  const { Text } = jest.requireActual<typeof import('react-native')>('react-native');
  const Icon = (props: { name: string }): React.JSX.Element => <Text>{`icon:${props.name}`}</Text>;
  return { Ionicons: Icon, MaterialCommunityIcons: Icon };
});

// The web card reads the taxonomy store to label a cuisine — a store this
// wiring doesn't touch, and providing it would only buy a costlier render.
// Same spirit as the `RecipeListItem` stub in `recipe-list-body.test.tsx`.
jest.mock('@presentation/base/widgets/cards/web-recipe-card', () => {
  const { Text } = jest.requireActual<typeof import('react-native')>('react-native');
  return { WebRecipeCard: (): React.JSX.Element => <Text>web-recipe-card</Text> };
});

const makeRecipe = (id: string): RecipeSummaryEntity => {
  const result = RecipeSummaryEntity.create({
    id,
    name: `Recipe ${id}`,
    image: `https://cdn.example.com/${id}.webp`,
    cuisine: CuisineKey.Italian,
    category: RecipeCategory.Dinner,
    difficulty: Difficulty.Easy,
    totalTimeMinutes: 30,
    rating: 4.5,
    moderationStatus: 'approved',
    likeCount: 0,
    likedByMe: false,
    commentCount: 0,
    viewCount: 0,
  });
  if (!result.ok) throw new Error('failed to build RecipeSummaryEntity fixture');
  return result.value;
};

const makeDraft = (id: string): RecipeDraft => ({
  id,
  ownerId: 'u1',
  prompt: 'a quick pasta',
  snapshot: { name: `Draft ${id}`, ingredients: ['pasta'] },
  chatHistory: [],
  createdAt: new Date('2026-07-01T10:00:00.000Z'),
  updatedAt: new Date('2026-07-02T10:00:00.000Z'),
});

/** The assistant's scroll props: attached to every branch, inert in a test. */
const SCROLLABLE = { ref: () => {}, onScroll: () => {}, scrollEventThrottle: 100 };

const baseProps = (): MyRecipesListProps => ({
  scrollable: SCROLLABLE,
  tab: 'saved',
  drafts: [],
  items: [],
  gridColumns: 1,
  isExpanded: false,
  isSaved: () => false,
  onToggleSave: jest.fn(),
  onOpenRecipe: jest.fn(),
  onOpenDraft: jest.fn(),
  onDeleteDraft: jest.fn(),
  isRefreshing: false,
  onRefresh: jest.fn(),
  onDraftsEndReached: jest.fn(),
  isFirstLoad: false,
  loadFailure: null,
  isLoadingMoreDrafts: false,
});

const render = (overrides: Partial<MyRecipesListProps>): ReactTestInstance => {
  const { root } = renderComponent(<MyRecipesList {...baseProps()} {...overrides} />);
  return root;
};

/**
 * The `refreshing` prop the rendered control actually receives. Throws rather
 * than returning a default if the control or the prop goes missing, so these
 * tests can't pass vacuously.
 */
const refreshingProp = (overrides: Partial<MyRecipesListProps>): boolean => {
  const refreshing = render(overrides).findByType(RefreshControl).props.refreshing;

  if (typeof refreshing !== 'boolean') {
    throw new Error(`expected a boolean 'refreshing' prop, got ${String(refreshing)}`);
  }
  return refreshing;
};

/** The empty-state branches: no items on saved/liked/created, no drafts on drafts. */
const EMPTY_TABS: readonly TabType[] = ['saved', 'liked', 'created', 'drafts'];

/**
 * THE REGRESSION: opening My Recipes flashed "you have nothing here".
 *
 * The list only ever asked "is this array empty?", which is true both before the
 * request comes back and after it comes back with nothing. So every cold open
 * rendered the empty state — icon, "no saved recipes yet" — and then replaced it
 * with the rows a moment later. `isFirstLoad` separates the two, and the
 * skeleton branch has to win over the empty one.
 */
describe('MyRecipesList — the first load', () => {
  afterEach(async () => {
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
  });

  const emptyCopy: Record<TabType, string> = {
    saved: t().myRecipes.emptySaved,
    liked: t().myRecipes.emptyLiked,
    created: t().myRecipes.emptyCreated,
    drafts: t().drafts.empty,
  };

  it.each(EMPTY_TABS)('shows a skeleton, not the empty state, while the %s tab loads', (tab) => {
    const root = render({ tab, items: [], drafts: [], isFirstLoad: true });

    expect(textContent(root)).not.toContain(emptyCopy[tab]);
    expect(allByTestId(root, MY_RECIPES_SKELETON_TEST_ID).length).toBeGreaterThan(0);
  });

  it.each(EMPTY_TABS)('shows the empty state on the %s tab once the load has answered', (tab) => {
    const root = render({ tab, items: [], drafts: [], isFirstLoad: false });

    // Non-vacuity for the assertion above: the same empty props DO produce the
    // empty copy the moment the tab is no longer waiting on an answer.
    expect(textContent(root)).toContain(emptyCopy[tab]);
  });

  it.each(EMPTY_TABS)('shows the failure, not the empty state, when the %s tab could not load', (tab) => {
    // Found in review: an offline cold open rendered "no saved recipes yet" —
    // the same lie the loading flash told, with a different cause.
    const root = render({ tab, items: [], drafts: [], loadFailure: new NetworkFailure('offline') });

    const texts = textContent(root);
    expect(texts).not.toContain(emptyCopy[tab]);
    expect(texts).toContain(t().errors.retry);
  });

  it('keeps the rows when a RELOAD fails, rather than replacing them with an error', () => {
    const root = render({
      tab: 'saved',
      items: [makeRecipe('r1')],
      loadFailure: new NetworkFailure('offline'),
    });

    expect(textContent(root)).not.toContain(t().errors.retry);
  });

  it('keeps rendering rows rather than a skeleton when a loaded tab reloads', () => {
    const root = render({ tab: 'saved', items: [makeRecipe('r1')], isFirstLoad: false });

    expect(allByTestId(root, MY_RECIPES_SKELETON_TEST_ID)).toHaveLength(0);
  });
});

describe('MyRecipesList — RefreshControl wiring', () => {
  // AppThemeProvider hydrates theme/preference from async storage on mount; let
  // those promises settle inside act so a late re-render can't fire after the
  // Jest environment is torn down — same pattern as the sibling body suites.
  afterEach(async () => {
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
  });

  describe('empty states are pullable', () => {
    it.each(EMPTY_TABS)('renders the empty %s tab on a scrollable surface carrying the RefreshControl', (tab) => {
      const onRefresh = jest.fn();

      const root = render({ tab, items: [], drafts: [], onRefresh });

      // A plain `View` would render the icon and copy but swallow the gesture:
      // the control must hang off a ScrollView.
      const scrollView = root.findByType(ScrollView);
      const control = root.findByType(RefreshControl);
      expect(scrollView.props.refreshControl).toBeDefined();
      expect(control.props.onRefresh).toBe(onRefresh);
    });

    it.each(EMPTY_TABS)('lets the empty %s tab content grow so the pull gesture has a surface', (tab) => {
      const root = render({ tab, items: [], drafts: [] });

      // Without flexGrow the content collapses to its natural height and there
      // is nothing tall enough to pull on.
      const contentStyle = root.findByType(ScrollView).props.contentContainerStyle;
      expect(contentStyle).toEqual(expect.objectContaining({ flexGrow: 1 }));
    });

    it.each(EMPTY_TABS)('shows the spinner on the empty %s tab while a pull is in flight', (tab) => {
      expect(refreshingProp({ tab, items: [], drafts: [], isRefreshing: true })).toBe(true);
    });
  });

  describe('populated lists', () => {
    it('gives the drafts list a RefreshControl bound to the pull handler', () => {
      const onRefresh = jest.fn();

      const root = render({ tab: 'drafts', drafts: [makeDraft('d1')], onRefresh });

      expect(root.findByType(FlatList).props.refreshControl).toBeDefined();
      expect(root.findByType(RefreshControl).props.onRefresh).toBe(onRefresh);
    });

    it('gives the saved grid a RefreshControl bound to the pull handler', () => {
      const onRefresh = jest.fn();

      const root = render({ tab: 'saved', items: [makeRecipe('r1')], onRefresh });

      expect(root.findByType(FlatList).props.refreshControl).toBeDefined();
      expect(root.findByType(RefreshControl).props.onRefresh).toBe(onRefresh);
    });

    it('gives the multi-column web grid a RefreshControl', () => {
      const root = render({
        tab: 'created',
        items: [makeRecipe('r1'), makeRecipe('r2')],
        gridColumns: 3,
        isExpanded: true,
      });

      // The grid remounts on a column change (`key={grid-${gridColumns}}`), an
      // easy place to drop the prop.
      expect(root.findByType(FlatList).props.refreshControl).toBeDefined();
    });
  });

  describe('the spinner reflects only the pull flag', () => {
    it('leaves the spinner off on a settled list', () => {
      expect(refreshingProp({ tab: 'saved', items: [makeRecipe('r1')], isRefreshing: false })).toBe(false);
    });

    it('shows the spinner on a populated list while a pull is in flight', () => {
      expect(refreshingProp({ tab: 'saved', items: [makeRecipe('r1')], isRefreshing: true })).toBe(true);
    });
  });
});
