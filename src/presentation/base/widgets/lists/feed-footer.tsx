import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import type { Failure } from '@core/failure';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { controlSizes, fontWeights, spacing } from '@presentation/base/theme';
import { useTranslations } from '@presentation/i18n';

export interface FeedFooterProps {
  /** True while the next page is being appended below the rows already shown. */
  isLoadingMore: boolean;
  /** Why the last next-page fetch failed (a `PagedList`'s `moreFailure`); null or absent when it did not. */
  failure?: Failure | null;
  /** Fetches the failed page again; the "Try again" row shows only when this is given. */
  onRetry?: () => void;
  /**
   * Whether another page exists. `true` keeps a spinner at the bottom even
   * before the next fetch starts; `false` says the list is finished. Absent
   * keeps the old behaviour (spinner only while loading).
   */
  hasMore?: boolean | undefined;
}

/**
 * The row under a paged list.
 *
 * @remarks
 * - **The bottom is never blank while more exists.** It used to render nothing
 *   until the next fetch began; reaching the bottom first, the list bounced on
 *   empty space and read as "no more recipes".
 * - **The end says so** when the caller knows it (`hasMore === false`), so a
 *   finished list is not mistaken for a stuck one.
 */

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
export const FeedFooter = ({ isLoadingMore, failure, onRetry, hasMore }: FeedFooterProps): React.JSX.Element | null => {
  const t = useTranslations();
  const colors = useTheme().colors;
  const failed = failure != null && onRetry !== undefined;
  if (isLoadingMore || (hasMore === true && !failed)) {
    return <ActivityIndicator color={colors.primary} style={styles.root} accessibilityLabel={t.common.loadingMore} />;
  }
  if (!failed) {
    return hasMore === false ? (
      <ThemedText variant="caption" muted style={styles.end}>
        {t.common.endOfList}
      </ThemedText>
    ) : null;
  }
  return (
    <View style={styles.failed}>
      <ThemedText variant="caption" muted>
        {t.errors.loadMoreFailed}
      </ThemedText>
      <Pressable accessibilityRole="button" onPress={onRetry} style={styles.retry}>
        <ThemedText variant="caption" style={[styles.retryLabel, { color: colors.primary }]}>
          {t.errors.retry}
        </ThemedText>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    paddingVertical: spacing.lg,
  },
  end: {
    textAlign: 'center',
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
