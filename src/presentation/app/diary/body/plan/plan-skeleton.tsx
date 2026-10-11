import { StyleSheet, View } from 'react-native';
import { MealSlot } from '@domain/diary/meal-slot';
import { SkeletonLoader } from '@presentation/base/widgets/loading/skeleton-loader';
import { mealPlanSizes, radii, spacing } from '@presentation/base/theme';
import { t } from '@presentation/i18n';

export interface PlanSkeletonProps {
  wide: boolean;
}

/** One placeholder row per meal slot, as the grid has. */
const GRID_ROWS = Object.values(MealSlot).length;

/**
 * The Plan view loading (design spec → Meal planner, States 2): the phone's
 * day head and three slot cards, or the web grid's cells, as `skeleton`
 * placeholders. Announced once as busy, "Loading your plan".
 */
export const PlanSkeleton = ({ wide }: PlanSkeletonProps): React.JSX.Element => (
  <View accessible accessibilityState={{ busy: true }} accessibilityLabel={t().mealPlan.loading} style={styles.stack}>
    {wide ? (
      Array.from({ length: GRID_ROWS }, (_, row) => (
        <SkeletonLoader key={row} width="100%" height={mealPlanSizes.gridCellMin} borderRadius={radii.lg} />
      ))
    ) : (
      <>
        <SkeletonLoader width="100%" height={mealPlanSizes.stripDay} borderRadius={radii.xl} />
        {Array.from({ length: mealPlanSizes.skeletonSlots }, (_, slot) => (
          <SkeletonLoader key={slot} width="100%" height={mealPlanSizes.gridCellMin} borderRadius={radii.xl} />
        ))}
      </>
    )}
  </View>
);

const styles = StyleSheet.create({
  stack: { gap: spacing.md },
});
