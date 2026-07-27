import { Fragment } from 'react';
import { StyleSheet, View } from 'react-native';
import { TimeCard } from '@presentation/app/recipes/[recipeId]/items/meta/time-card';
import { InfoStat } from '@presentation/app/recipes/[recipeId]/items/meta/info-stat';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, borderWidths } from '@presentation/base/theme';
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

/**
 * Unified rounded meta card for the mobile recipe detail screen: a single row of
 * equal-flex segments separated by hairline vertical dividers. Prep/cook segments
 * the cook time is a `TimeCard` (the recipe's one timer); prep, serves and
 * difficulty are static stats. Time segments render only when their minutes > 0.
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

  const segments: { key: string; node: React.JSX.Element }[] = [];

  if (prepTimeMinutes > ValueConstants.zero) {
    segments.push({
      key: 'prep',
      node: (
        // Prep time is a fact about the recipe, not something to count down:
        // chopping is not a step you set a kitchen timer for, and the card
        // carrying start/pause controls for it only invited a mis-tap that
        // blocked the cook timer. It reads as a stat, like servings.
        <InfoStat
          icon="time-outline"
          value={`${String(prepTimeMinutes)} ${t().recipes.minutes}`}
          label={t().recipes.prepTime}
        />
      ),
    });
  }
  if (cookTimeMinutes > ValueConstants.zero) {
    segments.push({
      key: 'cook',
      node: (
        <TimeCard
          label={t().recipes.cookTime}
          minutes={cookTimeMinutes}
          recipeId={recipeId}
          recipeName={recipeName}
        />
      ),
    });
  }
  segments.push({
    key: 'serves',
    node: <InfoStat icon="people-outline" value={String(servings)} label={t().recipes.servings} />,
  });
  segments.push({
    key: 'level',
    node: <InfoStat icon="speedometer-outline" value={difficulty} label={t().recipes.difficulty} />,
  });

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
      {segments.map((seg, i) => (
        <Fragment key={seg.key}>
          {i > ValueConstants.zero ? <View style={[styles.divider, { backgroundColor: colors.border }]} /> : null}
          {seg.node}
        </Fragment>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderWidth: borderWidths.thin,
    borderRadius: radii.xl,
    overflow: 'hidden',
    marginTop: spacing.md,
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    marginVertical: spacing.lg,
  },
});
