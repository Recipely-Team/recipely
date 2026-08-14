import { StoreStatus } from '@application/store/store-status';
import { bandFitsCuisines } from '@presentation/app/recipes/model/hero/hero-band-layout';
import { feedContentWidth } from '@presentation/app/recipes/model/feed-content-width';
import { HERO_MIN_RECIPES } from '@presentation/app/recipes/model/hero/hero-min-recipes';
import { useLayout } from '@presentation/base/responsive/use-layout';
import { useStores } from '@presentation/bootstrap/use-stores';

/**
 * Whether the cuisine filter is riding along in the hero band, rather than
 * rendering as the horizontal strip beneath it.
 *
 * @remarks
 * Both the band and the feed have to agree, and width alone is not enough to
 * agree on. The band renders nothing at all when trending has fewer than
 * {@link HERO_MIN_RECIPES} recipes — and when the feed suppressed the strip on
 * width alone, that took the cuisine filter off the page entirely. So the
 * question is "is the band actually showing them", not "would it fit them".
 */
export const useCuisinesInBand = (): boolean => {
  const { trendingRecipesStore } = useStores();
  const state = trendingRecipesStore((s) => s.state);
  const { width } = useLayout();

  const bandHasCards =
    state.status === StoreStatus.Loaded && state.recipes.length >= HERO_MIN_RECIPES;

  return bandHasCards && bandFitsCuisines(feedContentWidth(width));
};
