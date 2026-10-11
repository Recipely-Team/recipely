import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { PrimaryButton } from '@presentation/base/widgets/buttons/primary-button';
import { borderWidths, fontWeights, iconSizes, mealPlanSizes, opacities, radii, spacing } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { MealPlanLimits } from '@domain/meal-plan/meal-plan-limits';
import { EMPTY_WEEK_FILLED_TILES } from '@presentation/app/diary/model/plan/empty-week-tiles';

export interface PlanEmptyWeekProps {
  /** Index (0 = Monday) of today's tile when this is the current week, else null. */
  todayIndex: number | null;
  onAdd: () => void;
  onCopyLastWeek: () => void;
}


/**
 * The empty week (design spec → Meal planner, Empty week): seven rounded
 * tiles (today's `primary` with a plus, three holding a `chipBackground`
 * block), "Plan your week", and the two ways in — add a recipe, or copy last
 * week.
 */
export const PlanEmptyWeek = ({ todayIndex, onAdd, onCopyLastWeek }: PlanEmptyWeekProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const strings = t().mealPlan;
  return (
    <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
      <View style={styles.tiles} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {Array.from({ length: MealPlanLimits.daysPerWeek }, (_, index) => {
          const isToday = index === todayIndex;
          return (
            <View key={index} style={[styles.tile, { backgroundColor: isToday ? colors.primary : colors.surface, borderColor: colors.cardBorder }]}>
              {isToday ? <Ionicons name="add" size={iconSizes.md} color={colors.primaryText} /> : null}
              {!isToday && EMPTY_WEEK_FILLED_TILES.includes(index) ? <View style={[styles.block, { backgroundColor: colors.chipBackground }]} /> : null}
            </View>
          );
        })}
      </View>
      <SizedText size={mealPlanSizes.emptyTitle} weight={fontWeights.heavy} style={styles.center} accessibilityRole="header">
        {strings.emptyTitle}
      </SizedText>
      <SizedText size={mealPlanSizes.emptyBody} color={colors.textMuted} style={[styles.center, styles.body]}>
        {strings.emptyBody}
      </SizedText>
      <View style={styles.actions}>
        <PrimaryButton label={strings.addRecipe} onPress={onAdd} />
        <Pressable
          onPress={onCopyLastWeek}
          accessibilityRole="button"
          style={({ pressed }) => [styles.ghost, { borderColor: colors.cardBorder, opacity: pressed ? opacities.pressedSubtle : opacities.full }]}
        >
          <SizedText size={mealPlanSizes.emptyBody} weight={fontWeights.bold}>
            {strings.copyLastWeek}
          </SizedText>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.xl,
    borderWidth: borderWidths.hairline,
  },
  tiles: { flexDirection: 'row', gap: spacing.xs2, marginBottom: spacing.xs },
  tile: {
    width: mealPlanSizes.emptyTileWidth,
    height: mealPlanSizes.emptyTileHeight,
    borderRadius: mealPlanSizes.emptyTileRadius,
    borderWidth: borderWidths.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  block: { width: mealPlanSizes.emptyTileBlock, height: mealPlanSizes.emptyTileBlock, borderRadius: radii.sm },
  center: { textAlign: 'center' },
  body: { maxWidth: mealPlanSizes.emptyBodyMaxWidth },
  actions: { alignSelf: 'stretch', gap: spacing.sm, maxWidth: mealPlanSizes.emptyBodyMaxWidth, width: '100%', marginHorizontal: 'auto' },
  ghost: {
    minHeight: mealPlanSizes.cta,
    borderRadius: radii.round,
    borderWidth: borderWidths.hairline,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
});
