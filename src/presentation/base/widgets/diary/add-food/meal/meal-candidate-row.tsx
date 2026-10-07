import { Pressable, StyleSheet, View } from 'react-native';
import { CharConstants, ValueConstants } from '@core/constants';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { TickBox } from '@presentation/base/widgets/inputs/tick-box';
import { SuffixField } from '@presentation/base/widgets/diary/suffix-field';
import { DraftTag } from '@presentation/base/widgets/diary/add-food/pick/rows/draft-tag';
import { formatWholeNumber } from '@presentation/base/utils/diary/format-whole-number';
import { formatMacroLine } from '@presentation/base/utils/diary/format-macro-line';
import type { MealReviewRow } from '@presentation/base/widgets/diary/add-food/meal/state/meal-review-row';
import { borderWidths, controlSizes, diarySizes, fontSizes, fontWeights, spacing } from '@presentation/base/theme';
import { t, useLocale } from '@presentation/i18n';

export interface MealCandidateRowProps {
  row: MealReviewRow;
  onToggle: (key: string) => void;
  onGramsChange: (key: string, text: string) => void;
}

/**
 * One confirm-list row: a tick to include it, the label (with "Estimated" in
 * words when the figures are the model's), kcal and macros for the current
 * grams, and the grams box. The tick is a `checkbox` with its checked state,
 * so a screen reader says "Include menemen, checkbox, checked".
 */
export const MealCandidateRow = ({ row, onToggle, onGramsChange }: MealCandidateRowProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const locale = useLocale();
  const strings = t().diary;
  const { candidate } = row;
  const nutrients = candidate.nutrients;
  const macros = formatMacroLine(nutrients, locale);
  const kcal = `${formatWholeNumber(nutrients.calories, locale)} ${t().nutrition.kcal}`;
  return (
    <View style={[styles.row, { borderBottomColor: colors.cardBorder }]}>
      <Pressable
        onPress={() => onToggle(row.key)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: row.included }}
        accessibilityLabel={strings.mealLogInclude.replace('{name}', candidate.label)}
        style={styles.main}
      >
        <TickBox checked={row.included} />
        <View style={styles.text}>
          <View style={styles.title}>
            <SizedText size={fontSizes.body} weight={fontWeights.semibold} muted={!row.included} style={styles.label}>
              {candidate.label}
            </SizedText>
            {candidate.estimated ? <DraftTag label={strings.mealLogEstimated} /> : null}
          </View>
          <SizedText size={fontSizes.caption} muted>
            {macros === null ? kcal : `${kcal}${CharConstants.middotSpaced}${macros}`}
          </SizedText>
        </View>
      </Pressable>
      <SuffixField
        value={row.gramsText}
        onChangeText={(text) => onGramsChange(row.key, text)}
        accessibilityLabel={strings.mealLogGrams.replace('{name}', candidate.label)}
        suffix={t().nutrition.g}
        numeric
        style={styles.grams}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: diarySizes.pickRowMinHeight,
    paddingVertical: spacing.sm,
    borderBottomWidth: borderWidths.hairline,
  },
  main: { flex: ValueConstants.one, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: controlSizes.touchTarget },
  text: { flex: ValueConstants.one, gap: spacing.xxs },
  title: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.xs },
  label: { flexShrink: ValueConstants.one },
  grams: { width: diarySizes.mealGramsFieldWidth },
});
