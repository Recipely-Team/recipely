/**
 * Regression: on the web home, once the window was wide enough for the
 * three-column hero band, a ~100px strip of dead space appeared under the
 * cards — the featured photo, the two runners-up and the AI panel all ended at
 * the same line, and the page then held empty until "Browse cuisines".
 *
 * Two sizes disagreed. The row carried a per-breakpoint `minHeight` (440 above
 * 1200) while the featured card is sized by its own `aspectRatio`. At 1200 the
 * flex split hands that card ~538px, so the ratio asks for ~336 — the row was
 * held 100px taller than anything in it, and a wrap container distributes that
 * surplus as free space after the line, not into the cards.
 *
 * `react-test-renderer` performs no layout, so the assertion is on the rule
 * rather than the pixels: the band's row states no height, and the loading
 * placeholder borrows the same ratio so the band does not jump when the
 * recipes arrive. Both fail against the unfixed component.
 */

import { create } from 'zustand';
import { StyleSheet } from 'react-native';
import type { ReactTestInstance } from 'react-test-renderer';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { StoresProvider } from '@presentation/bootstrap/stores-context';
import type { Stores } from '@presentation/bootstrap/stores';
import { LayoutContext } from '@presentation/base/responsive/layout-context';
import type { LayoutContextValue } from '@presentation/base/responsive/layout-context-value';
import { OrientationType } from '@presentation/base/responsive/orientation-type';
import {
  WebHeroSection,
  WEB_HERO_ROW_TEST_ID,
  WEB_HERO_SKELETON_FEATURED_TEST_ID,
} from '@presentation/app/recipes/body/web-hero-section';
import { aspectRatios } from '@presentation/base/theme';
import { StoreStatus } from '@application/store/store-status';
import type { TrendingRecipesStoreState } from '@application/recipes/trending/trending-recipes-store-state';
import type { TrendingRecipesState } from '@application/recipes/trending/trending-recipes-state';
import { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';
import { CuisineKey } from '@domain/recipes/taxonomy/cuisine-key';
import { RecipeCategory } from '@domain/recipes/taxonomy/recipe-category';
import { Difficulty } from '@domain/recipes/difficulty';

jest.mock('@expo/vector-icons', () => {
  const { Text } = jest.requireActual<typeof import('react-native')>('react-native');
  const Icon = (props: { name: string }): React.JSX.Element => <Text>{`icon:${props.name}`}</Text>;
  return { Ionicons: Icon, MaterialCommunityIcons: Icon };
});

// The three blocks are stood in for: this suite is about the row that holds
// them, and the real cards pull images, gradients and the favourites store.
jest.mock('@presentation/app/recipes/items/hero/web-hero-featured-card', () => {
  const { Text } = jest.requireActual<typeof import('react-native')>('react-native');
  return { WebHeroFeaturedCard: (): React.JSX.Element => <Text>featured-card</Text> };
});
jest.mock('@presentation/app/recipes/items/hero/web-hero-mini-card', () => {
  const { Text } = jest.requireActual<typeof import('react-native')>('react-native');
  return { WebHeroMiniCard: (): React.JSX.Element => <Text>mini-card</Text> };
});
jest.mock('@presentation/app/recipes/items/banners/web-ai-banner', () => {
  const { Text } = jest.requireActual<typeof import('react-native')>('react-native');
  return { WebAiBanner: (): React.JSX.Element => <Text>ai-banner</Text> };
});

/** The width the band goes three-column at, and where the old floor overshot most. */
const THREE_COLUMN_WIDTH = 1200;

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

const makeStores = (state: TrendingRecipesState): Stores =>
  ({
    trendingRecipesStore: create<TrendingRecipesStoreState>(() => ({
      state,
      load: jest.fn(async () => undefined),
    })),
  }) as unknown as Stores;

const layoutAt = (width: number): LayoutContextValue => ({
  width,
  height: 900,
  aspectRatio: width / 900,
  orientation: OrientationType.Landscape,
  breakpoint: 'wide',
  isWebShell: true,
  isExpanded: true,
  isCompact: false,
});

const renderBand = (state: TrendingRecipesState): ReactTestInstance => {
  const { root } = renderComponent(
    <LayoutContext.Provider value={layoutAt(THREE_COLUMN_WIDTH)}>
      <StoresProvider value={makeStores(state)}>
        <WebHeroSection
          onOpenRecipe={jest.fn()}
          onOpenCreate={jest.fn()}
          isSaved={() => false}
          onToggleSave={jest.fn()}
        />
      </StoresProvider>
    </LayoutContext.Provider>,
  );
  return root;
};

/** The flattened style of the single node carrying `testID`. */
const styleOf = (root: ReactTestInstance, testID: string): Record<string, unknown> =>
  StyleSheet.flatten(
    root.find((node: ReactTestInstance) => node.props.testID === testID).props.style,
  ) as unknown as Record<string, unknown>;

describe('WebHeroSection — the band states no height of its own', () => {
  it('leaves no strip of dead space under the cards at the three-column width', () => {
    const root = renderBand({
      status: StoreStatus.Loaded,
      recipes: [makeRecipe('a'), makeRecipe('b'), makeRecipe('c')],
    });

    const row = styleOf(root, WEB_HERO_ROW_TEST_ID);

    expect(row.minHeight).toBeUndefined();
    expect(row.height).toBeUndefined();
  });

  it('sizes the loading placeholder by the same ratio, so the band does not jump on load', () => {
    const root = renderBand({ status: StoreStatus.Loading });

    expect(styleOf(root, WEB_HERO_ROW_TEST_ID).minHeight).toBeUndefined();
    expect(styleOf(root, WEB_HERO_SKELETON_FEATURED_TEST_ID).aspectRatio).toBe(
      aspectRatios.heroWide,
    );
  });
});
