import { ScrollView, StyleSheet } from 'react-native';
import { SkeletonCard } from '@presentation/base/widgets/cards/skeleton-card';
import { spacing } from '@presentation/base/theme';

/** Skeleton cards shown on mobile while the list loads. */
const SKELETON_CARD_COUNT = 4;

/**
 * Mobile loading placeholder: a stacked single column of skeleton cards that
 * mirrors the non-web list. The web shell shimmers only its recipe grid in-place
 * (see {@link WebRecipeGrid}), so it never uses this full-screen view.
 */
export const LoadingSkeleton = (): React.JSX.Element => (
  <ScrollView contentContainerStyle={styles.skeletonContainer}>
    {Array.from({ length: SKELETON_CARD_COUNT }, (_, i) => (
      <SkeletonCard key={i} />
    ))}
  </ScrollView>
);

const styles = StyleSheet.create({
  skeletonContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
});
