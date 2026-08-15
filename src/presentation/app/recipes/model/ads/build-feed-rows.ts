import { ValueConstants } from '@core/constants';
import { FEED_ROWS_BEFORE_FIRST_AD, FEED_ROWS_BETWEEN_ADS } from '@infrastructure/constants/ads';
import { FeedRowKind } from '@presentation/app/recipes/model/ads/feed-row-kind';

import type { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';
import type { FeedRow } from '@presentation/app/recipes/model/ads/feed-row';

/**
 * Lays the feed out as rows, placing an ad after every so many recipes.
 *
 * @remarks
 * - **Ads off is not "zero ads", it is the untouched list.** When they are
 *   disabled the recipes are wrapped and nothing else happens, so the feed a
 *   user without ads sees is the feed that existed before this file.
 * - **An ad is never the last row, and never the only one.** A trailing banner
 *   under the final recipe reads as the end of the app rather than the end of
 *   the list, and a feed too short to have reached the first gap has not earned
 *   one at all. Both fall out of only placing an ad when recipes follow it.
 * - **The gap after the first ad is wider than the run before it.** The feed
 *   has to read as a feed before it reads as inventory; the numbers live in
 *   `@infrastructure/constants/ads` because they are a product decision, not a
 *   layout detail.
 */
export const buildFeedRows = (
  recipes: readonly RecipeSummaryEntity[],
  adsEnabled: boolean,
): readonly FeedRow[] => {
  const rows: FeedRow[] = [];
  let sinceLastAd = ValueConstants.zero;
  let adsPlaced = ValueConstants.zero;

  for (const recipe of recipes) {
    const gap = adsPlaced === ValueConstants.zero ? FEED_ROWS_BEFORE_FIRST_AD : FEED_ROWS_BETWEEN_ADS;
    // Asked BEFORE the recipe is pushed, so the ad lands between two recipes:
    // there is always one above it and, because this runs inside the loop, one
    // below it too.
    if (adsEnabled && sinceLastAd === gap) {
      rows.push({ kind: FeedRowKind.Ad, ordinal: adsPlaced });
      adsPlaced += ValueConstants.one;
      sinceLastAd = ValueConstants.zero;
    }
    rows.push({ kind: FeedRowKind.Recipe, recipe });
    sinceLastAd += ValueConstants.one;
  }

  return rows;
};
