import { StyleSheet, View } from 'react-native';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { fridgeSizes, radii, spacing } from '@presentation/base/theme';
import { ValueConstants } from '@core/constants';

export interface IdeaMeterProps {
  used: number;
  missing: number;
}

/**
 * How complete the user's kitchen is for an idea: one 5pt segment per
 * ingredient it needs — `primary` for each the user has, `skeleton` for each
 * missing. Decorative: the sentence above it says the same in words.
 */
export const IdeaMeter = ({ used, missing }: IdeaMeterProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const total = Math.max(ValueConstants.one, used + missing);
  return (
    <View style={styles.row} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      {Array.from({ length: total }, (_, index) => (
        <View key={index} style={[styles.segment, { backgroundColor: index < used ? colors.primary : colors.skeleton }]} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.xxs,
  },
  segment: {
    flex: ValueConstants.one,
    height: fridgeSizes.meterSegment,
    borderRadius: radii.round,
  },
});
