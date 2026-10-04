import { StyleSheet, View } from 'react-native';
import { SkeletonLoader } from '@presentation/base/widgets/loading/skeleton-loader';
import { diarySizes, radii, spacing } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

const ROWS = Array.from({ length: diarySizes.pickSkeletonRows }, (_, index) => index);

/** Five placeholder rows while a first page loads (Add food v2 spec §4); announced as loading. */
export const PickSkeleton = (): React.JSX.Element => (
  <View accessibilityRole="progressbar" accessibilityLabel={t().common.loading} style={styles.stack}>
    {ROWS.map((row) => (
      <View key={row} style={styles.row}>
        <SkeletonLoader width={diarySizes.foodThumb} height={diarySizes.foodThumb} borderRadius={diarySizes.foodThumbRadius} />
        <View style={styles.text}>
          <SkeletonLoader width={diarySizes.pickSkeletonWide} height={diarySizes.pickSkeletonBar} borderRadius={radii.xs} />
          <SkeletonLoader width={diarySizes.pickSkeletonNarrow} height={diarySizes.pickSkeletonBar} borderRadius={radii.xs} />
        </View>
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  stack: { minHeight: diarySizes.pickBodyMinHeight },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: diarySizes.pickRowMinHeight },
  text: { flex: ValueConstants.one, gap: spacing.sm },
});
