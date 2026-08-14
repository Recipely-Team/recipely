import { useEffect, useRef } from 'react';
import { StoreStatus } from '@application/store/store-status';
import { StyleSheet, View } from 'react-native';
import { SkeletonLoader } from '@presentation/base/widgets/loading/skeleton-loader';
import { WebHeroFeaturedCard } from '@presentation/app/recipes/items/hero/web-hero-featured-card';
import { WebHeroMiniCard } from '@presentation/app/recipes/items/hero/web-hero-mini-card';
import { useStores } from '@presentation/bootstrap/use-stores';
import { useLayout } from '@presentation/base/responsive/use-layout';
import { spacing, radii, mediaSizes } from '@presentation/base/theme';
import { WebAiBanner } from '@presentation/app/recipes/items/banners/web-ai-banner';
import { aiPanelInRow, heroRowMinHeight, HeroFlex } from '@presentation/app/recipes/model/hero/hero-band-layout';
import { HERO_MIN_RECIPES } from '@presentation/app/recipes/model/hero/hero-min-recipes';
import { useLocale } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

/** Window width (px) below which the hero collapses to the featured card only. */
const STACK_WIDTH = 700;

/** Height of each mini-card skeleton so two fill the hero column. */
const MINI_SKELETON_HEIGHT = (mediaSizes.heroImageHeightWeb - spacing.sm2) / ValueConstants.two;

export interface WebHeroSectionProps {
  onOpenRecipe: (id: string) => void;
  /** Opens the AI generator; its panel is the row's third block. */
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
  onOpenCreate,
  isSaved,
  onToggleSave,
}: WebHeroSectionProps): React.JSX.Element | null => {
  const { trendingRecipesStore } = useStores();
  const state = trendingRecipesStore((s) => s.state);
  const load = trendingRecipesStore((s) => s.load);
  const { width } = useLayout();
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

  const stacked = width < STACK_WIDTH;
  const inRow = aiPanelInRow(width);
  // Grow/basis rather than a bare weight: each block states the width below
  // which it would rather the row wrapped than be squeezed.
  const rowMin = { minHeight: heroRowMinHeight(width) };
  const featuredFlex = { flexGrow: HeroFlex.featured.grow, flexBasis: HeroFlex.featured.basis };
  const miniFlex = { flexGrow: HeroFlex.runners.grow, flexBasis: HeroFlex.runners.basis };
  const aiFlex = inRow
    ? { flexGrow: HeroFlex.ai.grow, flexBasis: HeroFlex.ai.basis, maxWidth: HeroFlex.ai.max }
    : styles.aiBand;

  if (state.status === StoreStatus.Idle || state.status === StoreStatus.Loading) {
    return (
      <View style={[styles.row, rowMin, stacked ? styles.stacked : null]}>
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
    <View style={[styles.row, rowMin, stacked ? styles.stacked : null]}>
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
      {stacked ? null : (
        <View style={[styles.aiSlot, aiFlex]}>
          <WebAiBanner onPress={onOpenCreate} wide={!inRow} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  // `flexWrap` is what lets the AI panel drop to its own line instead of
  // squeezing the photography beside it; `alignItems: stretch` (the default)
  // keeps the three blocks the same height while they share a line.
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
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
  aiSlot: {
    minWidth: ValueConstants.zero,
  },
  // Below the wide breakpoint the panel takes a whole line of its own, which is
  // what turns the third column into the design's full-width band. Wrapping is
  // the collapse — nothing reorders.
  aiBand: {
    flexBasis: '100%',
    maxWidth: '100%',
  },
  mini: {
    minWidth: ValueConstants.zero,
    flexDirection: 'column',
    gap: spacing.sm2,
  },
});
