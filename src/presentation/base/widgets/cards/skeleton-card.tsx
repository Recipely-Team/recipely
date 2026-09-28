import { StyleSheet, View } from 'react-native';
import { SkeletonLoader } from '@presentation/base/widgets/loading/skeleton-loader';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, aspectRatios, borderWidths, decorSizes } from '@presentation/base/theme';
import { ValueConstants } from '@core/constants';

export const SkeletonCard = (): React.JSX.Element => {
  const colors = useTheme().colors;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
      ]}
    >
      {/* The same 16:10 box the card's cover takes, so nothing jumps when rows arrive. */}
      <View style={styles.cover}>
        <SkeletonLoader width="100%" height="100%" borderRadius={ValueConstants.zero} />
      </View>
      <View style={styles.body}>
        <SkeletonLoader width="60%" height={decorSizes.skeletonLineMd} borderRadius={radii.sm} />
        <View style={styles.row}>
          <SkeletonLoader width={decorSizes.skeletonChipWidth} height={decorSizes.skeletonLineSm} borderRadius={radii.sm} />
          <SkeletonLoader width={decorSizes.skeletonChipWidth} height={decorSizes.skeletonLineSm} borderRadius={radii.sm} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.xl,
    overflow: 'hidden',
    borderWidth: borderWidths.hairline,
  },
  cover: {
    aspectRatio: aspectRatios.heroWide,
  },
  body: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
});
