import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { spacing, radii, fontSizes, fontWeights, lineHeights, lineHeightFor } from '@presentation/base/theme';
import { CharConstants, ValueConstants } from '@core/constants';

export interface NutritionTileProps {
  label: string;
  /**
   * `undefined` means the backend sent no figure for this macro, which is NOT
   * the same claim as `0`. An em dash is rendered instead, and the unit is
   * dropped with it — "— g" would still imply a measured quantity.
   */
  value: number | undefined;
  unit: string;
  tileColor: string;
  valueColor: string;
  labelColor: string;
}

export const NutritionTile = ({ label, value, unit, tileColor, valueColor, labelColor }: NutritionTileProps): React.JSX.Element => (
  <View style={[styles.tile, { backgroundColor: tileColor }]}>
    <View style={styles.tileValueRow}>
      <ThemedText style={[styles.tileValue, { color: valueColor }]}>
        {value === undefined ? CharConstants.emDash : String(value)}
      </ThemedText>
      {value === undefined ? null : (
        <ThemedText style={[styles.tileUnit, { color: labelColor }]}>{unit}</ThemedText>
      )}
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
  // Both line boxes are derived, not pinned: RN scales `fontSize` by the OS
  // font setting but never `lineHeight`, so the old `fontSize + spacing.xs`
  // clipped these digits at large accessibility sizes (CLAUDE.md §6b).
  tileValue: {
    fontSize: fontSizes.heading,
    fontWeight: fontWeights.bold,
    lineHeight: lineHeightFor(fontSizes.heading, lineHeights.tight),
  },
  tileUnit: {
    fontSize: fontSizes.micro,
    lineHeight: lineHeightFor(fontSizes.heading, lineHeights.tight),
    paddingBottom: ValueConstants.one,
  },
  tileLabel: {
    fontSize: fontSizes.micro,
    marginTop: spacing.xxs,
  },
});
