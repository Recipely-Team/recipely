import { ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing } from '@presentation/base/theme';

export interface FeedFooterProps {
  /** True while the next page is being appended below the rows already shown. */
  isLoadingMore: boolean;
}

/**
 * Sits under the last loaded row while the next page is on its way, so a feed
 * that is still growing does not look like a feed that has ended.
 */
export const FeedFooter = ({ isLoadingMore }: FeedFooterProps): React.JSX.Element | null => {
  const colors = useTheme().colors;
  if (!isLoadingMore) return null;
  return <ActivityIndicator color={colors.primary} style={styles.root} />;
};

const styles = StyleSheet.create({
  root: {
    paddingVertical: spacing.lg,
  },
});
