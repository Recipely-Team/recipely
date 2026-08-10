import { StyleSheet, View } from 'react-native';
import { SkeletonLoader } from '@presentation/base/widgets/loading/skeleton-loader';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, mediaSizes, borderWidths } from '@presentation/base/theme';
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
      <SkeletonLoader width="100%" height={mediaSizes.cardImageHeight} borderRadius={ValueConstants.zero} />
      <View style={styles.body}>
        <SkeletonLoader width="60%" height={18} borderRadius={radii.sm} />
        <View style={styles.row}>
          <SkeletonLoader width={60} height={14} borderRadius={radii.sm} />
          <SkeletonLoader width={60} height={14} borderRadius={radii.sm} />
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
  body: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
});
