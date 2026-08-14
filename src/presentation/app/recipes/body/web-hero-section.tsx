import { useEffect, useRef } from 'react';
import { StoreStatus } from '@application/store/store-status';
import { StyleSheet, View } from 'react-native';
import { SkeletonLoader } from '@presentation/base/widgets/loading/skeleton-loader';
import { WebHeroFeaturedCard } from '@presentation/app/recipes/items/hero/web-hero-featured-card';
import { WebHeroMiniCard } from '@presentation/app/recipes/items/hero/web-hero-mini-card';
import { useStores } from '@presentation/bootstrap/use-stores';
import { useLayout } from '@presentation/base/responsive/use-layout';
import { spacing, radii, mediaSizes } from '@presentation/base/theme';
import { WebCuisineColumn } from '@presentation/app/recipes/body/web-cuisine-column';
import { WebAiBanner } from '@presentation/app/recipes/items/banners/web-ai-banner';
import { bandMaxWidth, HeroBandFlex } from '@presentation/app/recipes/model/hero/hero-band-layout';
import { HERO_MIN_RECIPES } from '@presentation/app/recipes/model/hero/hero-min-recipes';
import { useCuisinesInBand } from '@presentation/app/recipes/hooks/use-cuisines-in-band';
import { useLocale } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

/** Window width (px) below which the hero collapses to the featured card only. */
const STACK_WIDTH = 700;

/** Height of each mini-card skeleton so two fill the hero column. */
const MINI_SKELETON_HEIGHT = (mediaSizes.heroImageHeightWeb - spacing.sm2) / ValueConstants.two;

export interface WebHeroSectionProps {
  onOpenRecipe: (id: string) => void;
  /** Cuisine filter state, so the band can host the cuisine column when it fits. */
  selectedCuisines: string[];
  onToggleCuisine: (cuisine: string) => void;
  /** Opens the AI generator; the band hosts its banner when the side column is up. */
  onOpenCreate: () => void;
  /** True when the recipe id is in the signed-in user's saved set. */
  isSaved: (id: string) => boolean;
  onToggleSave: (id: string) => void;
}

/**
 * Web-only editorial hero: a featured trending recipe beside two ranked
 * mini-cards. Owns the `trendingRecipesStore` (loads on idle, re-fetches on
 * locale change — server localizes content via `Accept-Language`). Renders a
 * skeleton while loading and `null` on error or fewer than 3 recipes.
 */
export const WebHeroSection = ({
  onOpenRecipe,
  selectedCuisines,
  onToggleCuisine,
  onOpenCreate,
  isSaved,
  onToggleSave,
}: WebHeroSectionProps): React.JSX.Element | null => {
  const { trendingRecipesStore } = useStores();
  const state = trendingRecipesStore((s) => s.state);
  const load = trendingRecipesStore((s) => s.load);
  const { width, height } = useLayout();
  const language = useLocale();

  useEffect(() => {
    if (state.status === StoreStatus.Idle) {
      void load();
    }
  }, [state.status, load]);

  // Re-fetch on locale switch (skip the first run so it doesn't double-load
  // alongside the idle-guard mount effect above).
  const didMountRef = useRef(false);
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    void load();
  }, [language, load]);

  const cuisinesInBand = useCuisinesInBand();
  const stacked = width < STACK_WIDTH;
  const withCuisines = !stacked && cuisinesInBand;
  const rowCap = { maxWidth: bandMaxWidth(height, withCuisines) };
  const featuredFlex = { flex: HeroBandFlex.featured };
  const miniFlex = { flex: HeroBandFlex.mini };
  const cuisineFlex = { flex: HeroBandFlex.cuisines };

  if (state.status === StoreStatus.Idle || state.status === StoreStatus.Loading) {
    return (
      <View style={[styles.row, rowCap, stacked ? styles.stacked : null]}>
        <View style={[styles.featured, featuredFlex]}>
          <SkeletonLoader width="100%" height={mediaSizes.heroImageHeightWeb} borderRadius={radii.xxl2} />
        </View>
        {stacked ? null : (
          <View style={[styles.mini, miniFlex]}>
            <SkeletonLoader width="100%" height={MINI_SKELETON_HEIGHT} borderRadius={radii.xxl} />
            <SkeletonLoader width="100%" height={MINI_SKELETON_HEIGHT} borderRadius={radii.xxl} />
          </View>
        )}
      </View>
    );
  }

  if (state.status === StoreStatus.Error || state.recipes.length < HERO_MIN_RECIPES) {
    return null;
  }

  const [featured, mini1, mini2] = state.recipes;

  return (
    <View style={[styles.row, rowCap, stacked ? styles.stacked : null]}>
      <View style={[styles.featured, featuredFlex]}>
        <WebHeroFeaturedCard
          recipe={featured}
          onPress={onOpenRecipe}
          savedByMe={isSaved(featured.id)}
          onSave={onToggleSave}
        />
      </View>
      {stacked ? null : (
        <View style={[styles.mini, miniFlex]}>
          <WebHeroMiniCard recipe={mini1} rank={2} onPress={onOpenRecipe} />
          <WebHeroMiniCard recipe={mini2} rank={3} onPress={onOpenRecipe} />
        </View>
      )}
      {withCuisines ? (
        <View style={[styles.sideSlot, cuisineFlex]}>
          <View style={styles.sideStack}>
            <WebAiBanner onPress={onOpenCreate} compact />
            <View style={styles.cuisineSlot}>
              <WebCuisineColumn selectedCuisines={selectedCuisines} onToggle={onToggleCuisine} />
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm2,
    marginBottom: spacing.lg,
    width: '100%',
    alignSelf: 'center',
  },
  stacked: {
    flexDirection: 'column',
  },
  featured: {
    minWidth: ValueConstants.zero,
  },
  sideSlot: {
    minWidth: ValueConstants.zero,
  },
  // Absolutely filled so the stack cannot push the band taller than the ratio
  // says; the banner sits on top and the cuisines take whatever is left.
  sideStack: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'column',
    gap: spacing.sm2,
  },
  // `position: relative` is what the absolutely-filled cuisine panel anchors to.
  cuisineSlot: {
    position: 'relative',
    flex: ValueConstants.one,
    minWidth: ValueConstants.zero,
  },
  mini: {
    minWidth: ValueConstants.zero,
    flexDirection: 'column',
    gap: spacing.sm2,
  },
});
