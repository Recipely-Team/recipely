import { StyleSheet, View } from 'react-native';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { spacing, radii, fontWeights, borderWidths } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import type { RecipeNutrition } from '@domain/recipes/recipe-nutrition';
import { NutritionTile } from '@presentation/app/recipes/[recipeId]/items/nutrition/nutrition-tile';
import type { NutritionTileProps } from '@presentation/app/recipes/[recipeId]/items/nutrition/nutrition-tile';
import { ValueConstants } from '@core/constants';

export interface NutritionCardProps {
  caloriesPerServing: number;
  servings: number;
  nutrition?: RecipeNutrition;
}

/** Displays per-serving macros (calories, protein, carbs, fat, fiber) from the recipe. */
export const NutritionCard = ({ caloriesPerServing, servings, nutrition }: NutritionCardProps): React.JSX.Element | null => {
  const { colors } = useTheme();
  const strings = t().nutrition;

  const hasData =
    caloriesPerServing > ValueConstants.zero ||
    (nutrition?.protein ?? ValueConstants.zero) > ValueConstants.zero ||
    (nutrition?.carbs ?? ValueConstants.zero) > ValueConstants.zero ||
    (nutrition?.fat ?? ValueConstants.zero) > ValueConstants.zero ||
    (nutrition?.fiber ?? ValueConstants.zero) > ValueConstants.zero;

  if (!hasData) return null;

  const tiles: NutritionTileProps[] = [
    {
      label: strings.calories,
      value: caloriesPerServing,
      unit: strings.kcal,
      tileColor: colors.primaryLight,
      valueColor: colors.primary,
      labelColor: colors.textMuted,
    },
    {
      label: strings.protein,
      value: nutrition?.protein ?? ValueConstants.zero,
      unit: strings.g,
      tileColor: colors.chipBackground,
      valueColor: colors.text,
      labelColor: colors.textMuted,
    },
    {
      label: strings.carbs,
      value: nutrition?.carbs ?? ValueConstants.zero,
      unit: strings.g,
      tileColor: colors.chipBackground,
      valueColor: colors.text,
      labelColor: colors.textMuted,
    },
    {
      label: strings.fat,
      value: nutrition?.fat ?? ValueConstants.zero,
      unit: strings.g,
      tileColor: colors.chipBackground,
      valueColor: colors.text,
      labelColor: colors.textMuted,
    },
  ];

  const fiberValue = nutrition?.fiber ?? ValueConstants.zero;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
      <View style={styles.header}>
        <ThemedText variant="label" style={styles.title}>{strings.title}</ThemedText>
        <ThemedText variant="caption" muted>
          {`${String(servings)} ${strings.perServing}`}
        </ThemedText>
      </View>
      <View style={styles.tilesRow}>
        {tiles.map((tile) => (
          <NutritionTile key={tile.label} {...tile} />
        ))}
      </View>
      {fiberValue > ValueConstants.zero ? (
        <View style={[styles.fiberRow, { borderTopColor: colors.border }]}>
          <ThemedText variant="caption" style={{ color: colors.text }}>
            {strings.fiberValue.replace('{value}', String(fiberValue))}
          </ThemedText>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.xl,
    borderWidth: borderWidths.hairline,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  title: {
    fontWeight: fontWeights.semibold,
  },
  tilesRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  fiberRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
