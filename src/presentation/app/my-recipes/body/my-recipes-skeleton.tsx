import { StyleSheet, View } from 'react-native';
import { SkeletonLoader } from '@presentation/base/widgets/loading/skeleton-loader';
import { SkeletonCard } from '@presentation/base/widgets/cards/skeleton-card';
import { TabType } from '@presentation/app/my-recipes/model/tab-type';
import { GRID_GAP } from '@presentation/app/my-recipes/model/grid-metrics';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, fontSizes, mediaSizes, borderWidths } from '@presentation/base/theme';
import { ValueConstants } from '@core/constants';

export interface MyRecipesSkeletonProps {
  tab: TabType;
  /** Matches the real grid so the placeholder occupies the layout it will hand over to. */
  gridColumns: number;
}

/** Handle for the tests that pin the skeleton branch over the empty state. */
export const MY_RECIPES_SKELETON_TEST_ID = 'my-recipes-skeleton';

/** Placeholder rows/cards rendered while a tab loads for the first time. */
const PLACEHOLDER_COUNT = 4;
const THUMB = mediaSizes.draftThumb;

/**
 * The My-Recipes loading state: draft rows or recipe cards in the shape of the
 * tab that is loading, so the content lands in place rather than replacing an
 * empty state that said the user had nothing.
 */
export const MyRecipesSkeleton = ({ tab, gridColumns }: MyRecipesSkeletonProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const placeholders = Array.from({ length: PLACEHOLDER_COUNT }, (_, i) => i);

  if (tab === TabType.Drafts) {
    return (
      <View style={styles.list} testID={MY_RECIPES_SKELETON_TEST_ID} accessibilityRole="progressbar">
        {placeholders.map((i) => (
          <View
            key={i}
            style={[
              styles.draftRow,
              { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
            ]}
          >
            <SkeletonLoader width={THUMB} height={THUMB} borderRadius={radii.lg} />
            <View style={styles.draftBody}>
              <SkeletonLoader width="35%" height={fontSizes.small} borderRadius={radii.round} />
              <SkeletonLoader width="70%" height={fontSizes.body} borderRadius={radii.sm} />
              <SkeletonLoader width="50%" height={fontSizes.caption} borderRadius={radii.sm} />
            </View>
          </View>
        ))}
      </View>
    );
  }

  // Chunked into rows of `gridColumns` so each cell can be `flex: 1` — the same
  // shape `FlatList`'s `columnWrapperStyle` produces, without a width percentage
  // to keep in step with the column count.
  const rows: number[][] = [];
  for (let i = ValueConstants.zero; i < placeholders.length; i += gridColumns) {
    rows.push(placeholders.slice(i, i + gridColumns));
  }

  return (
    <View style={styles.list} testID={MY_RECIPES_SKELETON_TEST_ID} accessibilityRole="progressbar">
      {rows.map((row) => (
        <View key={row[ValueConstants.zero]} style={styles.gridRow}>
          {row.map((i) => (
            <View key={i} style={styles.gridCell}>
              <SkeletonCard />
            </View>
          ))}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  gridRow: {
    flexDirection: 'row',
    gap: GRID_GAP,
  },
  gridCell: {
    flex: ValueConstants.one,
  },
  draftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.sm2,
    borderRadius: radii.xl,
    borderWidth: borderWidths.hairline,
  },
  draftBody: {
    flex: ValueConstants.one,
    gap: spacing.xxs,
  },
});
