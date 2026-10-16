import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { FoodThumb } from '@presentation/base/widgets/diary/food-thumb';
import { FoodThumbIcon } from '@presentation/base/widgets/diary/food-thumb-icon';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { formatPerServing } from '@presentation/base/utils/meal-plan/format-per-serving';
import { mealLabel } from '@presentation/base/utils/diary/meal-label';
import { upperCase } from '@presentation/i18n/upper-case';
import { borderWidths, fontSizes, fontWeights, iconSizes, mealPlanSizes, radii, spacing, controlSizes } from '@presentation/base/theme';
import { t, useLocale } from '@presentation/i18n';
import { CharConstants, ValueConstants } from '@core/constants';
import type { ProposalRow } from '@presentation/app/diary/model/plan/proposal-row';

export interface PlanProposalRowProps {
  row: ProposalRow;
  onSwap: (key: string) => void;
}

const META_JOIN = ' · ';

/**
 * One open meal in the Plan my week proposal (prototype §2, step 2): the
 * recipe card with a Swap toggle between the pick and its one alternative, or
 * a dashed row when no saved recipe fits.
 */
export const PlanProposalRow = ({ row, onSwap }: PlanProposalRowProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const locale = useLocale();
  const strings = t().mealPlan.planWeek;
  const slot = upperCase(mealLabel(row.meal));

  if (row.shown === null) {
    return (
      <View style={[styles.empty, { borderColor: colors.border }]}>
        <SizedText size={fontSizes.tiny} weight={fontWeights.bold} color={colors.textMuted}>{slot}</SizedText>
        <SizedText size={fontSizes.caption} color={colors.textMuted}>{strings.none}</SizedText>
      </View>
    );
  }
  const recipe = row.shown;
  const meta = [
    formatPerServing(recipe.caloriesPerServing, locale),
    recipe.totalTimeMinutes !== null ? `${recipe.totalTimeMinutes} ${t().recipes.minutes}` : CharConstants.empty,
  ].filter((part) => part.length > ValueConstants.zero).join(META_JOIN);

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
      <FoodThumb imageUrl={recipe.imageUrl} icon={recipe.imageUrl === null ? FoodThumbIcon.Food : null} size={mealPlanSizes.pickThumb} />
      <View style={styles.text}>
        <SizedText size={fontSizes.tiny} weight={fontWeights.bold} color={colors.textMuted}>{slot}</SizedText>
        <SizedText size={mealPlanSizes.plannedTitle} weight={fontWeights.semibold} numberOfLines={ValueConstants.one}>{recipe.name}</SizedText>
        <SizedText size={fontSizes.caption} color={colors.textMuted} numberOfLines={ValueConstants.one}>{meta}</SizedText>
      </View>
      {row.other !== null ? (
        <Pressable
          onPress={() => onSwap(row.key)}
          accessibilityRole="button"
          accessibilityState={{ selected: row.swapped }}
          accessibilityLabel={strings.swapA11y.replace('{name}', row.other.name)}
          style={[
            styles.swap,
            row.swapped
              ? { backgroundColor: colors.chipBackground, borderColor: colors.chipBackground }
              : { backgroundColor: colors.background, borderColor: colors.cardBorder },
          ]}
        >
          <Ionicons name="refresh" size={iconSizes.sm} color={row.swapped ? colors.chipText : colors.text} />
          <SizedText size={fontSizes.caption} weight={fontWeights.bold} color={row.swapped ? colors.chipText : colors.text}>
            {strings.swap}
          </SizedText>
        </Pressable>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: mealPlanSizes.pickRowMin,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm2,
    borderRadius: radii.lg,
    borderWidth: borderWidths.hairline,
  },
  empty: {
    minHeight: mealPlanSizes.actionRowMin,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.lg,
    borderWidth: borderWidths.thin,
    borderStyle: 'dashed',
    gap: spacing.xxs,
    justifyContent: 'center',
  },
  text: { flex: ValueConstants.one, gap: spacing.xxs },
  swap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: controlSizes.iconBtn,
    paddingHorizontal: spacing.md,
    borderRadius: radii.round,
    borderWidth: borderWidths.hairline,
  },
});
