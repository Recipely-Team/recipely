import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { spacing, radii, fontSizes, fontWeights } from '@presentation/base/theme';
import { ValueConstants } from '@core/constants';

export interface NutritionTileProps {
  label: string;
  value: number;
  unit: string;
  tileColor: string;
  valueColor: string;
  labelColor: string;
}

export const NutritionTile = ({ label, value, unit, tileColor, valueColor, labelColor }: NutritionTileProps): React.JSX.Element => (
  <View style={[styles.tile, { backgroundColor: tileColor }]}>
    <View style={styles.tileValueRow}>
      <ThemedText style={[styles.tileValue, { color: valueColor }]}>{String(value)}</ThemedText>
      <ThemedText style={[styles.tileUnit, { color: labelColor }]}>{unit}</ThemedText>
    </View>
    <ThemedText style={[styles.tileLabel, { color: labelColor }]}>{label}</ThemedText>
  </View>
);

const styles = StyleSheet.create({
  tile: {
    flex: ValueConstants.one,
    borderRadius: radii.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
  },
  tileValueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.xxs,
  },
  tileValue: {
    fontSize: fontSizes.heading,
    fontWeight: fontWeights.bold,
    lineHeight: fontSizes.heading + spacing.xs,
  },
  tileUnit: {
    fontSize: fontSizes.micro,
    lineHeight: fontSizes.heading + spacing.xs,
    paddingBottom: ValueConstants.one,
  },
  tileLabel: {
    fontSize: fontSizes.micro,
    marginTop: spacing.xxs,
  },
});
