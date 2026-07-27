import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, borderWidths } from '@presentation/base/theme';
import { t } from '@presentation/i18n';

/**
 * "The assistant is still working" strip, shown in the collapsed refine dock.
 *
 * The only sign a refine was in flight used to be the typing bubble inside the
 * expanded transcript, so closing the assistant while waiting took the answer's
 * only trace with it: the recipe would rewrite itself minutes later with
 * nothing having said it was coming. This keeps the request visible wherever
 * the user parks the dock.
 */
export const RefinePendingRow = (): React.JSX.Element => {
  const colors = useTheme().colors;

  return (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      <ActivityIndicator size="small" color={colors.primary} />
      <ThemedText variant="caption" muted>
        {t().createRecipe.refining}
      </ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: borderWidths.hairline,
  },
});
