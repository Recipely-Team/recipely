import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, fontSizes, fontWeights, controlSizes } from '@presentation/base/theme';
import { t } from '@presentation/i18n';

export interface CheckChipProps {
  /** The legend's copy of the chip is decoration; a row's chip is announced. */
  decorative?: boolean;
}

/**
 * The small "Check" chip on a line the import guessed (prototype: Import
 * Review board). `chipBackground` / `chipText`, round, aligned with the first
 * text line; it disappears once the line is edited.
 */
export const CheckChip = ({ decorative = false }: CheckChipProps): React.JSX.Element => {
  const colors = useTheme().colors;
  return (
    <View
      style={[styles.chip, { backgroundColor: colors.chipBackground }]}
      accessible={!decorative}
      importantForAccessibility={decorative ? 'no-hide-descendants' : 'auto'}
      accessibilityLabel={decorative ? undefined : t().createRecipe.importReview.chipA11y}
    >
      <ThemedText style={[styles.label, { color: colors.chipText }]}>{t().createRecipe.importReview.check}</ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  chip: {
    minHeight: controlSizes.checkChip,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.round,
    justifyContent: 'center',
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
  },
  label: { fontSize: fontSizes.tiny, fontWeight: fontWeights.bold },
});
