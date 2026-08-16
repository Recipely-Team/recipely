/**
 * Regression: the web hero band left a strip of dead space under its cards
 * once the window was wide enough for three columns. Full account in
 * `docs/regressions.md`.
 *
 * `react-test-renderer` performs no layout, so these assert the rule rather
 * than the pixels — the row states no height, and the loading placeholder
 * reserves the same ratio AND the same slots as the loaded band. Each fails
 * against the version of the component it was written for.
 */

import { create } from 'zustand';
import { StyleSheet } from 'react-native';
import { isString } from '@core/guards/type-guards';
import { ValueConstants } from '@core/constants';
import type { ReactTestInstance } from 'react-test-renderer';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { StoresProvider } from '@presentation/bootstrap/stores-context';
import type { Stores } from '@presentation/bootstrap/stores';
import { BREAKPOINTS } from '@presentation/base/responsive/breakpoints';
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

/** The width the band goes three-column at — the same one `aiPanelInRow` asks about. */
const THREE_COLUMN_WIDTH = BREAKPOINTS.wide;

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

const instancesIn = (children: (ReactTestInstance | string)[]): ReactTestInstance[] =>
  children.filter((child): child is ReactTestInstance => !isString(child));

/**
 * The width share every block rendered on the line claims, in render order.
 *
 * `find` matches the composite `View`; the slots hang off the host node it
 * renders, one level down.
 */
const slotWidths = (root: ReactTestInstance): unknown[] => {
  const row = root.find((node: ReactTestInstance) => node.props.testID === WEB_HERO_ROW_TEST_ID);
  const host = instancesIn(row.children)[ValueConstants.zero];
  return instancesIn(host.children).map((slot: ReactTestInstance) => {
    const style = StyleSheet.flatten(slot.props.style) as unknown as Record<string, unknown>;
    return { flexGrow: style.flexGrow, flexBasis: style.flexBasis, maxWidth: style.maxWidth };
  });
};

const LOADED: TrendingRecipesState = {
  status: StoreStatus.Loaded,
  recipes: [makeRecipe('a'), makeRecipe('b'), makeRecipe('c')],
};

describe('WebHeroSection — the band states no height of its own', () => {
  it('leaves no strip of dead space under the cards at the three-column width', () => {
    const row = styleOf(renderBand(LOADED), WEB_HERO_ROW_TEST_ID);

    expect(row.minHeight).toBeUndefined();
    expect(row.height).toBeUndefined();
  });

  it('sizes the loading placeholder by the same ratio', () => {
    const root = renderBand({ status: StoreStatus.Loading });

    expect(styleOf(root, WEB_HERO_ROW_TEST_ID).minHeight).toBeUndefined();
    expect(styleOf(root, WEB_HERO_SKELETON_FEATURED_TEST_ID).aspectRatio).toBe(
      aspectRatios.heroWide,
    );
  });

  // The ratio alone is not enough: it turns the featured block's WIDTH into the
  // band's height, so a placeholder that reserves a different set of slots is a
  // different width and therefore a different height. Dropping the AI slot from
  // the loading branch shrank the band ~140px on load.
  it('reserves the same slots while loading as it does once the recipes arrive', () => {
    expect(slotWidths(renderBand({ status: StoreStatus.Loading }))).toEqual(
      slotWidths(renderBand(LOADED)),
    );
  });
});
