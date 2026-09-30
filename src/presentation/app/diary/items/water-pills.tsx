import { StyleSheet, View } from 'react-native';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { diarySizes, radii, spacing } from '@presentation/base/theme';

export interface WaterPillsProps {
  glasses: number;
  goal: number;
}

/** One pill per glass of the goal, filled up to what was drunk. Decorative: the row's text says the numbers. */
export const WaterPills = ({ glasses, goal }: WaterPillsProps): React.JSX.Element => {
  const colors = useTheme().colors;
  return (
    <View style={styles.row} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {Array.from({ length: goal }, (_, i) => (
        <View key={i} style={[styles.pill, { backgroundColor: i < glasses ? colors.primary : colors.skeleton }]} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  pill: { width: diarySizes.waterPillWidth, height: diarySizes.waterPillHeight, borderRadius: radii.round },
});
