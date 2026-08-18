import { StyleSheet, View } from 'react-native';
import { ValueConstants } from '@core/constants';
import { t } from '@presentation/i18n';
import { AdSlot } from '@presentation/base/widgets/ads/ad-slot';
import { RecipeListItem } from '@presentation/app/recipes/items/cards/recipe-list-item';
import { FeedRowKind } from '@presentation/app/recipes/model/ads/feed-row-kind';

import type { FeedRow } from '@presentation/app/recipes/model/ads/feed-row';

export interface FeedRowViewProps {
  row: FeedRow;
  /** > 1 puts each recipe in a grid cell; ads are only ever placed at 1. */
  gridColumns: number;
  adUnitId: string;
  /** Width the banner is requested at, so it lines up with the cards. */
  adWidth: number;
  /**
   * The list body's stable curried opener. Taken as the factory, not as an
   * already-bound handler, so this file does not change how `RecipeListItem`
   * receives its `onPress` — see the memoisation note in `recipe-list-body`.
   */
  openRecipe: (id: string) => () => void;
}

/**
 * One row of the recipe feed — a recipe card, or the ad standing in for one.
 *
 * Split out of `recipe-list-body` so that file stays inside the 300-line
 * ceiling once the feed had two kinds of row to render (CLAUDE.md §18).
 */
export const FeedRowView = ({
  row,
  gridColumns,
  adUnitId,
  adWidth,
  openRecipe,
}: FeedRowViewProps): React.JSX.Element => {
  if (row.kind === FeedRowKind.Ad) {
    return <AdSlot unitId={adUnitId} width={adWidth} accessibilityLabel={t().createRecipe.adLabel} />;
  }
  const card = <RecipeListItem recipe={row.recipe} onPress={openRecipe(row.recipe.id)} />;
  if (gridColumns > ValueConstants.one) {
    return <View style={styles.gridCell}>{card}</View>;
  }
  return card;
};

const styles = StyleSheet.create({
  gridCell: {
    flex: ValueConstants.one,
    minWidth: ValueConstants.zero,
  },
});
