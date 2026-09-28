import { useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { TimeCard } from '@presentation/app/recipes/[recipeId]/items/meta/time-card';
import { InfoStat } from '@presentation/app/recipes/[recipeId]/items/meta/info-stat';
import { statCellWidths } from '@presentation/app/recipes/[recipeId]/model/meta/stat-cell-widths';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, borderWidths } from '@presentation/base/theme';
import { shadows } from '@presentation/base/theme/tokens/effects/shadows';
import { difficultyLabel } from '@presentation/base/taxonomy/difficulty-label';
import { t } from '@presentation/i18n';
import type { Difficulty } from '@domain/recipes/difficulty';
import { ValueConstants } from '@core/constants';

export interface RecipeMetaCardProps {
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  difficulty: Difficulty;
  recipeId: string;
  recipeName: string;
}

const FRAME = { border: borderWidths.thin, gap: borderWidths.hairline } as const;

/**
 * The mobile recipe detail's stat tiles: prep, cook, servings, difficulty.
 *
 * @remarks
 * - **A time tile only when its minutes are > 0**, so a card holds 2–4 tiles.
 * - **Cook time is the recipe's one timer**; prep is a fact, not a countdown —
 *   chopping is not a step you set a kitchen timer for, and a second timer tile
 *   invited the mis-tap that blocked the cook timer.
 * - **The card's own width decides the grid** (`onLayout`), never the window's:
 *   at or below `statGrid.narrowMaxWidth` the tiles fold into two columns.
 * - **Dividers are the card showing through** 1pt gaps between surface tiles,
 *   so a wrapped grid gets its horizontal rule for free.
 * - **Difficulty goes through `difficultyLabel`**, as the web sidebar does;
 *   the raw wire value "EASY" was printed on the phone.
 * - **The shadow sits on an outer view**: on Android `overflow: hidden` and
 *   `elevation` on one view clips the shadow away.
 */
export const RecipeMetaCard = ({
  prepTimeMinutes,
  cookTimeMinutes,
  servings,
  difficulty,
  recipeId,
  recipeName,
}: RecipeMetaCardProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const [cardWidth, setCardWidth] = useState<number>(ValueConstants.zero);
  const strings = t().recipes;

  const tiles: { key: string; node: React.JSX.Element }[] = [];
  if (prepTimeMinutes > ValueConstants.zero) {
    tiles.push({
      key: 'prep',
      node: <InfoStat icon="time-outline" value={`${String(prepTimeMinutes)} ${strings.minutes}`} label={strings.prepShort} />,
    });
  }
  if (cookTimeMinutes > ValueConstants.zero) {
    tiles.push({
      key: 'cook',
      node: <TimeCard label={strings.cookShort} minutes={cookTimeMinutes} recipeId={recipeId} recipeName={recipeName} />,
    });
  }
  tiles.push({ key: 'serves', node: <InfoStat icon="people-outline" value={String(servings)} label={strings.servings} /> });
  tiles.push({
    key: 'level',
    node: <InfoStat icon="speedometer-outline" value={difficultyLabel(difficulty)} label={strings.difficulty} />,
  });

  const widths = statCellWidths(cardWidth, tiles.length, FRAME);
  const onLayout = (event: LayoutChangeEvent): void => setCardWidth(event.nativeEvent.layout.width);

  return (
    <View style={[styles.shadow, shadows.sm]}>
      <View
        onLayout={onLayout}
        style={[styles.card, { backgroundColor: colors.border, borderColor: colors.cardBorder }]}
      >
        {tiles.map((tile, i) => (
          <View
            key={tile.key}
            style={[
              { backgroundColor: colors.surface },
              widths === null ? styles.unmeasured : { width: widths[i] },
            ]}
          >
            {tile.node}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  shadow: {
    marginTop: spacing.md,
    borderRadius: radii.xl,
  },
  card: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: FRAME.gap,
    rowGap: FRAME.gap,
    borderWidth: FRAME.border,
    borderRadius: radii.xl,
    overflow: 'hidden',
  },
  unmeasured: {
    flex: ValueConstants.one,
  },
});
