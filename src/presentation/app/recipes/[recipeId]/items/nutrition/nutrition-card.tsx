import { StyleSheet, View } from 'react-native';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { spacing, radii, fontWeights, borderWidths } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import type { RecipeNutrition } from '@domain/recipes/recipe-nutrition';
import { NutritionTile } from '@presentation/app/recipes/[recipeId]/items/nutrition/nutrition-tile';
import type { NutritionTileProps } from '@presentation/app/recipes/[recipeId]/items/nutrition/nutrition-tile';
import { ValueConstants } from '@core/constants';
import { hasReportedNutrition } from '@presentation/app/recipes/[recipeId]/model/has-reported-nutrition';

export interface NutritionCardProps {
  caloriesPerServing: number;
  servings: number;
  nutrition?: RecipeNutrition;
  /** The backend is still computing; the empty state says so instead of "none". */
  isCalculating: boolean;
}

/**
 * A figure the backend actually reported, or `undefined`.
 *
 * The API sends `0` both for "measured as zero" and for "never filled in", and
 * some recipes arrive with calories but every macro at 0. Rendering those as
 * "0 g protein" states a nutritional fact the backend never claimed, so a
 * non-positive figure is treated as absent and the tile shows an em dash.
 */
const reported = (value: number | undefined): number | undefined =>
  value !== undefined && value > ValueConstants.zero ? value : undefined;

/**
 * Displays per-serving macros (calories, protein, carbs, fat, fiber).
 *
 * Always renders: a recipe with no nutrition at all says so explicitly rather
 * than returning `null`, because a silently missing section is indistinguishable
 * from a broken screen — which is exactly how it was reported.
 *
 * @remarks
 * - **"None" and "not yet" are different sentences.** The backend computes
 *   these figures after the recipe is saved, so a recipe opened moments after
 *   publishing has none through no fault of its own. Saying it has no
 *   nutritional information is a claim about the recipe; the truth was a claim
 *   about the clock.
 */
export const NutritionCard = ({
  caloriesPerServing,
  servings,
  nutrition,
  isCalculating,
}: NutritionCardProps): React.JSX.Element => {
  const { colors } = useTheme();
  const strings = t().nutrition;

  const calories = reported(caloriesPerServing);
  const protein = reported(nutrition?.protein);
  const carbs = reported(nutrition?.carbs);
  const fat = reported(nutrition?.fat);
  const fiber = reported(nutrition?.fiber);

  const hasAnyData = hasReportedNutrition(caloriesPerServing, nutrition);

  const tiles: NutritionTileProps[] = [
    {
      label: strings.calories,
      value: calories,
      unit: strings.kcal,
      tileColor: colors.primaryLight,
      valueColor: colors.primary,
      labelColor: colors.textMuted,
    },
    {
      label: strings.protein,
      value: protein,
      unit: strings.g,
      tileColor: colors.chipBackground,
      valueColor: colors.text,
      labelColor: colors.textMuted,
    },
    {
      label: strings.carbs,
      value: carbs,
      unit: strings.g,
      tileColor: colors.chipBackground,
      valueColor: colors.text,
      labelColor: colors.textMuted,
    },
    {
      label: strings.fat,
      value: fat,
      unit: strings.g,
      tileColor: colors.chipBackground,
      valueColor: colors.text,
      labelColor: colors.textMuted,
    },
  ];

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
      <View style={styles.header}>
        <ThemedText variant="label" style={styles.title}>{strings.title}</ThemedText>
        <ThemedText variant="caption" muted>
          {`${String(servings)} ${strings.perServing}`}
        </ThemedText>
      </View>
      {hasAnyData ? (
        <>
          <View style={styles.tilesRow}>
            {tiles.map((tile) => (
              <NutritionTile key={tile.label} {...tile} />
            ))}
          </View>
          {fiber === undefined ? null : (
            <View style={[styles.fiberRow, { borderTopColor: colors.border }]}>
              <ThemedText variant="caption" style={{ color: colors.text }}>
                {strings.fiberValue.replace('{value}', String(fiber))}
              </ThemedText>
            </View>
          )}
        </>
      ) : (
        <ThemedText variant="caption" muted>
          {isCalculating ? strings.calculating : strings.unavailable}
        </ThemedText>
      )}
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
