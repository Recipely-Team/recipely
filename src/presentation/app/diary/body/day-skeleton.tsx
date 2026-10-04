import { StyleSheet, View } from 'react-native';
import { SkeletonLoader } from '@presentation/base/widgets/loading/skeleton-loader';
import { diarySizes, radii, spacing } from '@presentation/base/theme';
import { MealSlot } from '@domain/diary/meal-slot';

/** Placeholder for a day that has never loaded: the summary and the four meal cards, as shapes. */
export const DaySkeleton = (): React.JSX.Element => (
  <View style={styles.stack} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
    <SkeletonLoader width="100%" height={diarySizes.ringMobile + spacing.xxl} borderRadius={radii.xl} />
    <SkeletonLoader width="100%" height={diarySizes.itemRowMinHeight} borderRadius={radii.xl} />
    {Object.values(MealSlot).map((meal) => (
      <SkeletonLoader key={meal} width="100%" height={diarySizes.itemRowMinHeight + diarySizes.emptyMealMinHeight} borderRadius={radii.xl} />
    ))}
  </View>
);

const styles = StyleSheet.create({
  stack: { gap: diarySizes.mealGap },
});
