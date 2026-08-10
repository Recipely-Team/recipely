import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, fontSizes, fontWeights, letterSpacings, borderWidths } from '@presentation/base/theme';
import { ValueConstants } from '@core/constants';

export interface IngredientGroupHeadingProps {
  label: string;
  /** True for the first row of the list, which needs no separating space above. */
  isFirst: boolean;
}

/**
 * Names one component of a recipe made of parts — a dessert's syrup, a cake's
 * filling — inside the ingredient list.
 *
 * Deliberately NOT a checkbox row: there is nothing to tick off, and giving it
 * the same affordance as an ingredient would invite a tap that does nothing.
 * It reads as a label instead, with a rule running out from it so the group it
 * opens is visible at a glance while scanning the list mid-cook.
 */
export const IngredientGroupHeading = ({
  label,
  isFirst,
}: IngredientGroupHeadingProps): React.JSX.Element => {
  const colors = useTheme().colors;

  return (
    <View
      accessibilityRole="header"
      style={[styles.row, isFirst ? null : styles.spaced]}
    >
      <ThemedText variant="caption" style={[styles.label, { color: colors.primary }]}>
        {label}
      </ThemedText>
      <View style={[styles.rule, { backgroundColor: colors.border }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  spaced: {
    marginTop: spacing.md,
  },
  label: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacings.wide,
    textTransform: 'uppercase',
  },
  rule: {
    flex: ValueConstants.one,
    height: borderWidths.hairline,
  },
});
