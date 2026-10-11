import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import type { Failure } from '@core/failure';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { controlSizes, fontWeights, spacing } from '@presentation/base/theme';
import { t } from '@presentation/i18n';

export interface FeedFooterProps {
  /** True while the next page is being appended below the rows already shown. */
  isLoadingMore: boolean;
  /** Why the last next-page fetch failed (a `PagedList`'s `moreFailure`); null or absent when it did not. */
  failure?: Failure | null;
  /** Fetches the failed page again; the "Try again" row shows only when this is given. */
  onRetry?: () => void;
}

/**
 * Sits under the last loaded row: a spinner while the next page is on its way,
 * and a "Couldn't load more · Try again" row when it failed.
 *
 * @remarks
 * - **A failed page must not look like the end of the list.** The loader keeps
 *   the rows and records `moreFailure`, but most lists rendered nothing for it:
 *   the spinner vanished, the list simply ended, and `onEndReached` never fired
 *   again because the content length had not changed. Every paged list passes
 *   its `moreFailure` and its `loadMore` here.
 */
export const FeedFooter = ({ isLoadingMore, failure, onRetry }: FeedFooterProps): React.JSX.Element | null => {
  const colors = useTheme().colors;
  if (isLoadingMore) return <ActivityIndicator color={colors.primary} style={styles.root} />;
  if (failure == null || onRetry === undefined) return null;
  return (
    <View style={styles.failed}>
      <ThemedText variant="caption" muted>
        {t().errors.loadMoreFailed}
      </ThemedText>
      <Pressable accessibilityRole="button" onPress={onRetry} style={styles.retry}>
        <ThemedText variant="caption" style={[styles.retryLabel, { color: colors.primary }]}>
          {t().errors.retry}
        </ThemedText>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    paddingVertical: spacing.lg,
  },
  failed: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  retry: {
    minHeight: controlSizes.touchTarget,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  retryLabel: {
    fontWeight: fontWeights.semibold,
  },
});
