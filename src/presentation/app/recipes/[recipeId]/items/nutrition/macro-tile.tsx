import { StyleSheet, View } from 'react-native';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { useTextLineHeight } from '@presentation/base/theme/tokens/typography/use-text-line-height';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { borderWidths, fontSizes, fontWeights, lineHeights, radii, spacing } from '@presentation/base/theme';
import { t, useLocale } from '@presentation/i18n';
import type { MacroReading } from '@domain/recipes/nutrition/macro-reading';
import { ValueConstants } from '@core/constants';
import { formatNutritionNumber } from '@presentation/app/recipes/[recipeId]/model/nutrition/format-nutrition-number';
import { macroBarColors } from '@presentation/app/recipes/[recipeId]/model/nutrition/macro-bar-colors';
import { nutritionPanelSizes } from '@presentation/app/recipes/[recipeId]/model/nutrition/nutrition-panel-sizes';

export interface MacroTileProps {
  reading: MacroReading;
  compact: boolean;
}

/** One macro: grams, its name, and a bar filled to its share of the daily reference. */
export const MacroTile = ({ reading, compact }: MacroTileProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const strings = t().nutrition;
  const locale = useLocale();
  const valueLineHeight = useTextLineHeight(fontSizes.subtitle, lineHeights.tight);
  const smallLineHeight = useTextLineHeight(fontSizes.small, lineHeights.snug);
  const dvLineHeight = useTextLineHeight(fontSizes.micro, lineHeights.snug);
  const percent = reading.dailyValuePercent;

  return (
    <View
      style={[
        styles.tile,
        compact ? styles.tileCompact : null,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={styles.valueRow}>
        <ThemedText style={[styles.value, { lineHeight: valueLineHeight, color: colors.text }]}>
          {formatNutritionNumber(reading.grams, locale)}
        </ThemedText>
        <ThemedText muted style={[styles.unit, { lineHeight: smallLineHeight }]}>
          {strings.g}
        </ThemedText>
      </View>
      <ThemedText muted style={[styles.label, { lineHeight: smallLineHeight }]}>
        {strings[reading.macro]}
      </ThemedText>
      <View style={[styles.track, { backgroundColor: colors.border }]}>
        <View style={[styles.fill, { width: `${percent}%`, backgroundColor: macroBarColors[reading.macro] }]} />
      </View>
      <ThemedText muted style={[styles.dv, { lineHeight: dvLineHeight }]}>
        {strings.dv.replace('{p}', formatNutritionNumber(percent, locale))}
      </ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  tile: {
    flex: ValueConstants.one,
    borderRadius: radii.lg,
    borderWidth: borderWidths.hairline,
    padding: spacing.md,
    gap: spacing.xs2,
  },
  tileCompact: {
    paddingVertical: spacing.sm2,
    paddingHorizontal: spacing.md,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xxs,
  },
  value: {
    fontSize: fontSizes.subtitle,
    fontWeight: fontWeights.heavy,
    fontVariant: ['tabular-nums'],
  },
  unit: {
    fontSize: fontSizes.small,
    fontWeight: fontWeights.semibold,
  },
  label: {
    fontSize: fontSizes.small,
    fontWeight: fontWeights.semibold,
  },
  track: {
    height: nutritionPanelSizes.barHeight,
    borderRadius: nutritionPanelSizes.barRadius,
    overflow: 'hidden',
  },
  fill: {
    height: nutritionPanelSizes.barHeight,
    borderRadius: nutritionPanelSizes.barRadius,
  },
  dv: {
    fontSize: fontSizes.micro,
    fontWeight: fontWeights.medium,
  },
});
