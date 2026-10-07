import { StyleSheet, View } from 'react-native';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { controlSizes, radii } from '@presentation/base/theme';
import { ValueConstants } from '@core/constants';

export interface CookProgressBarProps {
  /** Zero-based step on screen. */
  index: number;
  total: number;
}

/** How far through the recipe the cook is: the step on screen counts as reached. */
export const CookProgressBar = ({ index, total }: CookProgressBarProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const reached = total > ValueConstants.zero ? (index + ValueConstants.one) / total : ValueConstants.zero;

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.track, { backgroundColor: colors.cardBorder }]}
    >
      <View style={[styles.fill, { flex: reached, backgroundColor: colors.primary }]} />
      <View style={{ flex: ValueConstants.one - reached }} />
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    height: controlSizes.progressBar,
    borderRadius: radii.round,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: radii.round,
  },
});
