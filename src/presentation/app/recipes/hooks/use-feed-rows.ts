import { useCallback, useMemo } from 'react';
import { ValueConstants } from '@core/constants';
import { FEED_BANNER_UNIT_ID } from '@infrastructure/constants/ads';
import { useAdsReady } from '@presentation/base/hooks/ads/use-ads-ready';
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
 * - **The key is the whole reason ads carry an ordinal.** `FlatList` remounts a
 *   row whose key changed, and a remounted banner requests a fresh ad; keying
 *   an ad by its index would do that to every ad below an inserted recipe each
 *   time a page arrives.
 */
export const useFeedRows = ({ recipes, isReloading, gridColumns }: UseFeedRowsArgs) => {
  const adsReady = useAdsReady();
  const interleaveAds = adsReady && gridColumns === ValueConstants.one;

  const rows = useMemo(
    () => buildFeedRows(isReloading ? [] : recipes, interleaveAds),
    [recipes, interleaveAds, isReloading],
  );

  const keyExtractor = useCallback(
    (row: FeedRow): string => (row.kind === FeedRowKind.Ad ? `ad-${row.ordinal}` : row.recipe.id),
    [],
  );

  return { rows, keyExtractor, adUnitId: FEED_BANNER_UNIT_ID };
};
