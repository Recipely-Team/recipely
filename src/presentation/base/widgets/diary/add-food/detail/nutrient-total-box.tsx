import { StyleSheet, View } from 'react-native';
import type { Nutrients } from '@domain/diary/nutrition/nutrients';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { formatWholeNumber } from '@presentation/base/utils/diary/format-whole-number';
import { diarySizes, fontSizes, fontWeights, lineHeights, radii, spacing } from '@presentation/base/theme';
import { t, useLocale } from '@presentation/i18n';
import { CharConstants, ValueConstants } from '@core/constants';

export interface NutrientTotalBoxProps {
  /** For the whole amount on the stepper, not one serving. */
  nutrients: Nutrients;
}

/**
 * The detail step's total: kcal large, then protein · carbs · fat · fiber —
 * or "calories only" when the food never reported macros. An unknown single
 * macro shows an em dash, never a 0.
 */
export const NutrientTotalBox = ({ nutrients }: NutrientTotalBoxProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const locale = useLocale();
  const strings = t().nutrition;
  const macros = [
    { key: 'protein', label: strings.protein, value: nutrients.protein },
    { key: 'carbs', label: strings.carbs, value: nutrients.carbs },
    { key: 'fat', label: strings.fat, value: nutrients.fat },
    { key: 'fiber', label: strings.fiber, value: nutrients.fiber },
  ];
  return (
    <View style={[styles.box, { backgroundColor: colors.surface }]} accessible>
      <View style={styles.kcalRow}>
        <SizedText size={diarySizes.sheetTotal} weight={fontWeights.heavy} ratio={lineHeights.tight}>
          {formatWholeNumber(nutrients.calories, locale)}
        </SizedText>
        <SizedText size={fontSizes.caption} weight={fontWeights.semibold} muted>
          {strings.kcal}
        </SizedText>
      </View>
      {nutrients.hasMacros ? (
        <View style={styles.macros}>
          {macros.map((macro) => (
            <View key={macro.key} style={styles.macro}>
              <SizedText size={fontSizes.body} weight={fontWeights.bold}>
                {macro.value === null ? CharConstants.emDash : `${formatWholeNumber(macro.value, locale)} ${strings.g}`}
              </SizedText>
              <SizedText size={fontSizes.micro} muted numberOfLines={ValueConstants.one}>
                {macro.label}
              </SizedText>
            </View>
          ))}
        </View>
      ) : (
        <SizedText size={fontSizes.caption} muted>
          {t().diary.caloriesOnly}
        </SizedText>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  box: {
    borderRadius: radii.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  kcalRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs },
  macros: { flexDirection: 'row', gap: spacing.sm },
  macro: { flex: ValueConstants.one, gap: spacing.xxs },
});
