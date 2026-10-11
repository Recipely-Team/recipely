import { StyleSheet, View, type DimensionValue } from 'react-native';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { useDiaryTones } from '@presentation/base/theme/colors/tones/use-diary-tones';
import { radii } from '@presentation/base/theme';
import { ValueConstants } from '@core/constants';

export interface KcalBarProps {
  planned: number;
  goal: number;
  height: number;
  /** The bar's width inside its parent; full width by default. */
  width?: DimensionValue;
  /** Track and fill colours for a filled (selected) background. */
  inverse?: { track: string; fill: string };
}

const FULL = 100;

/**
 * Planned kcal against the daily goal (design spec → Meal planner, kcal bar):
 * `skeleton` track, `primary` fill, the diary's "over" tone past the goal.
 * Decorative — the number beside it carries the meaning.
 */
export const KcalBar = ({ planned, goal, height, width = '100%', inverse }: KcalBarProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const tones = useDiaryTones();
  const ratio = goal > ValueConstants.zero ? Math.min(ValueConstants.one, planned / goal) : ValueConstants.zero;
  const over = goal > ValueConstants.zero && planned > goal;
  const fill = inverse?.fill ?? (over ? tones.over.solid : colors.primary);
  return (
    <View
      style={[styles.track, { height, width, backgroundColor: inverse?.track ?? colors.skeleton }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View style={[styles.fill, { width: `${Math.round(ratio * FULL)}%`, backgroundColor: fill }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  track: { borderRadius: radii.round, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radii.round },
});
