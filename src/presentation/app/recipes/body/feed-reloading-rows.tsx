import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing } from '@presentation/base/theme';
import { t } from '@presentation/i18n';

/**
 * Stands in for the feed's rows while a filter / sort / search / language
 * change is being fetched.
 *
 * The feed used to keep the previous results on screen and float a
 * "Refreshing…" pill over them. Two sets of recipes then appeared in sequence
 * for one tap, which read as the list loading twice — and while the old rows
 * were up, nothing distinguished "these are the new results" from "your tap
 * did nothing". Blanking the rows for the round trip says plainly that what
 * was there no longer answers the question that was just asked.
 *
 * Only the ROWS are replaced: this renders inside the list, under the feed
 * header, so the cuisine strip and the active-filter chips stay put — the way
 * out of a filter is to un-tap it, and it must not disappear mid-load.
 */
export const FeedReloadingRows = (): React.JSX.Element => {
  const colors = useTheme().colors;

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      <ThemedText variant="body" muted style={styles.label}>
        {t().common.loading}
      </ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxxl,
    gap: spacing.md,
  },
  label: {
    textAlign: 'center',
  },
});
