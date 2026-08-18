import { useCallback, useMemo } from 'react';
import { ValueConstants } from '@core/constants';
import { feedBannerUnitId } from '@infrastructure/constants/ads';
import { useAdsReady } from '@presentation/base/hooks/ads/use-ads-ready';
import { useLayout } from '@presentation/base/responsive/use-layout';
import { mobileFeedRowWidth } from '@presentation/app/recipes/model/feed-content-width';
import { buildFeedRows } from '@presentation/app/recipes/model/ads/build-feed-rows';
import { FeedRowKind } from '@presentation/app/recipes/model/ads/feed-row-kind';

import type { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';
import type { FeedRow } from '@presentation/app/recipes/model/ads/feed-row';

interface UseFeedRowsArgs {
  recipes: readonly RecipeSummaryEntity[];
  /** Emptied while the next filter's results are fetched — see the list body. */
  isReloading: boolean;
  gridColumns: number;
}

/**
 * The feed's rows and the key for each, with ads placed among them.
 *
 * @remarks
 * - **Single column only.** In a grid an ad would have to occupy a cell, which
 *   puts it *inside* the run of photo cards rather than between two of them —
 *   the placement the rules rule out, and the one most likely to be tapped by
 *   mistake.
 * - **The banner's width is published with its unit id.** An adaptive banner
 *   asks the SDK for a size and defaults to the DEVICE width, which ignores the
 *   list's padding and runs the ad edge to edge past the cards. The row width
 *   is a property of this feed, so it is answered here rather than guessed at
 *   by the widget.
 * - **The key is the whole reason ads carry an ordinal.** `FlatList` remounts a
 *   row whose key changed, and a remounted banner requests a fresh ad; keying
 *   an ad by its index would do that to every ad below an inserted recipe each
 *   time a page arrives.
 */
export const useFeedRows = ({ recipes, isReloading, gridColumns }: UseFeedRowsArgs) => {
  const adsReady = useAdsReady();
  const { width } = useLayout();
  const interleaveAds = adsReady && gridColumns === ValueConstants.one;

  const rows = useMemo(
    () => buildFeedRows(isReloading ? [] : recipes, interleaveAds),
    [recipes, interleaveAds, isReloading],
  );

  const keyExtractor = useCallback(
    (row: FeedRow): string => (row.kind === FeedRowKind.Ad ? `ad-${row.ordinal}` : row.recipe.id),
    [],
  );

  return { rows, keyExtractor, adUnitId: feedBannerUnitId(), adWidth: mobileFeedRowWidth(width) };
};
