import { StyleSheet, View } from 'react-native';
import { SkeletonLoader } from '@presentation/base/widgets/loading/skeleton-loader';
import { aspectRatios, controlSizes, fontSizes, radii, spacing } from '@presentation/base/theme';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

/**
 * Recipe detail while it loads: the hero photo at its own 4:3, then the
 * title, a meta row and a few lines of text, in the theme's `skeleton` colour
 * — the shape of the page that is coming, as the feed and My Recipes do,
 * instead of a bare spinner. Announced once as busy.
 */
export const DetailSkeleton = (): React.JSX.Element => {
  const colors = useTheme().colors;
  return (
    <View accessible accessibilityState={{ busy: true }} accessibilityLabel={t().common.loading} style={styles.root}>
      <View style={[styles.hero, { backgroundColor: colors.skeleton }]} />
      <View style={styles.body}>
        <SkeletonLoader width="80%" height={fontSizes.title} borderRadius={radii.sm} />
        <SkeletonLoader width="50%" height={fontSizes.body} borderRadius={radii.sm} />
        <SkeletonLoader width="100%" height={controlSizes.buttonSm} borderRadius={radii.xl} />
        <SkeletonLoader width="100%" height={fontSizes.body} borderRadius={radii.sm} />
        <SkeletonLoader width="92%" height={fontSizes.body} borderRadius={radii.sm} />
        <SkeletonLoader width="70%" height={fontSizes.body} borderRadius={radii.sm} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: ValueConstants.one },
  hero: { width: '100%', aspectRatio: aspectRatios.hero },
  body: { padding: spacing.lg, gap: spacing.md },
});
