import { StyleSheet, View } from 'react-native';
import { SkeletonLoader } from '@presentation/base/widgets/loading/skeleton-loader';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { borderWidths, controlSizes, fontSizes, fridgeSizes, radii, spacing } from '@presentation/base/theme';
import { ValueConstants } from '@core/constants';

/** An idea card's shape while ideas load — tile, title and meta lines, the meter, a chip row. */
export const IdeaSkeletonCard = (): React.JSX.Element => {
  const colors = useTheme().colors;
  return (
    <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
      <View style={styles.top}>
        <SkeletonLoader width={fridgeSizes.ideaTile} height={fridgeSizes.ideaTile} borderRadius={radii.lg} />
        <View style={styles.lines}>
          <SkeletonLoader width="80%" height={fontSizes.heading} />
          <SkeletonLoader width="45%" height={fontSizes.caption} />
        </View>
      </View>
      <SkeletonLoader width="100%" height={fridgeSizes.meterSegment} borderRadius={radii.round} />
      <SkeletonLoader width="60%" height={fridgeSizes.missingChip} borderRadius={radii.round} />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.xl,
    borderWidth: borderWidths.hairline,
    padding: spacing.lg,
    gap: spacing.md,
    minHeight: controlSizes.button,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  lines: {
    flex: ValueConstants.one,
    gap: spacing.xs2,
  },
});
