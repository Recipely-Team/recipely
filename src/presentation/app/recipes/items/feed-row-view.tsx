import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { ValueConstants } from '@core/constants';
import { t } from '@presentation/i18n';
import { AdSlot } from '@presentation/base/widgets/ads/ad-slot';
import { RecipeListItem } from '@presentation/app/recipes/items/cards/recipe-list-item';
import { FeedRowKind } from '@presentation/app/recipes/model/ads/feed-row-kind';

import type { FeedRowType } from '@presentation/app/recipes/model/ads/feed-row';

export interface FeedRowViewProps {
  row: FeedRowType;
  /** > 1 puts each recipe in a grid cell; ads are only ever placed at 1. */
  gridColumns: number;
  adUnitId: string;
  /** Width the banner is requested at, so it lines up with the cards. */
  adWidth: number;
  /** The screen's stable opener, passed through unbound — the row binds it to its id. */
  onOpenRecipe: (id: string) => void;
}

/**
 * One row of the recipe feed — a recipe card, or the ad standing in for one.
 *
 * Split out of `recipe-list-body` so that file stays inside the 300-line
 * ceiling once the feed had two kinds of row to render (CLAUDE.md §18).
 *
 * @remarks
 * **Memoised, with only stable props.** It used to call a curried
 * `openRecipe(id)` here, minting a new `onPress` for `RecipeListItem` on every
 * render, so that row's `memo` never bailed out.
 */
const FeedRowViewComponent = ({
  row,
  gridColumns,
  adUnitId,
  adWidth,
  onOpenRecipe,
}: FeedRowViewProps): React.JSX.Element => {
  if (row.kind === FeedRowKind.Ad) {
    return <AdSlot unitId={adUnitId} width={adWidth} accessibilityLabel={t().createRecipe.adLabel} />;
  }
  const card = <RecipeListItem recipe={row.recipe} onOpen={onOpenRecipe} />;
  if (gridColumns > ValueConstants.one) {
    return <View style={styles.gridCell}>{card}</View>;
  }
  return card;
};

export const FeedRowView = memo(FeedRowViewComponent);

const styles = StyleSheet.create({
  gridCell: {
    flex: ValueConstants.one,
    minWidth: ValueConstants.zero,
  },
});
