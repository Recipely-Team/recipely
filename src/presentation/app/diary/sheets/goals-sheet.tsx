import { StyleSheet, View } from 'react-native';
import { NutritionGoals } from '@domain/diary/nutrition/nutrition-goals';
import { BottomSheet } from '@presentation/base/widgets/sheets/bottom-sheet';
import { PrimaryButton } from '@presentation/base/widgets/buttons/primary-button';
import { RoundIconButton } from '@presentation/base/widgets/buttons/round-icon-button';
import { SuffixField } from '@presentation/base/widgets/diary/suffix-field';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { useDiaryTones } from '@presentation/base/theme/colors/tones/use-diary-tones';
import { formatWholeNumber } from '@presentation/base/utils/diary/format-whole-number';
import { parseDecimalInput } from '@presentation/base/utils/diary/parse-decimal-input';
import { controlSizes, diarySizes, fontSizes, fontWeights, lineHeights, radii, spacing } from '@presentation/base/theme';
import { GoalMacroRow } from '@presentation/app/diary/items/goal-macro-row';
import { StatusMarker } from '@presentation/app/diary/shared/items/status-marker';
import { StatusMarkerKind } from '@presentation/app/diary/shared/model/status-marker-kind';
import { useGoalsForm } from '@presentation/app/diary/hooks/use-goals-form';
import { t, useLocale } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';
import type { AtwaterFactors } from '@domain/diary/nutrition/atwater-factors';
import { NutritionMacro } from '@domain/recipes/nutrition/nutrition-macro';

export interface GoalsSheetProps {
  visible: boolean;
  onClose: () => void;
}


/**
 * Daily goals (design spec → Food Diary §7): the calorie goal with ±50 steps,
 * the gram goals with each macro's share of the calories, and a warning when
 * the macros drift more than 10% from the calorie goal. Saving recomputes the
 * whole diary at once — the store re-derives every cached day and month.
 */
export const GoalsSheet = ({ visible, onClose }: GoalsSheetProps): React.JSX.Element => {
  const locale = useLocale();
  const tones = useDiaryTones();
  const form = useGoalsForm(visible, onClose);
  const strings = t().diary;
  const nutrition = t().nutrition;
  const { candidate } = form;
  const share = (macro: keyof typeof AtwaterFactors): string | null =>
    candidate === null ? null : strings.calorieShare.replace('{n}', formatWholeNumber(candidate.calorieShare(macro) * ValueConstants.percent, locale));
  const calories = parseDecimalInput(form.values.calories) ?? ValueConstants.zero;

  return (
    <BottomSheet
      visible={visible}
      title={strings.dailyGoals}
      onClose={onClose}
      rightAction={{ label: strings.goalsDefaults, onPress: form.resetToDefaults }}
      dialogMaxWidth={diarySizes.goalsDialogMaxWidth}
      footer={<PrimaryButton label={strings.saveGoals} onPress={form.save} loading={form.isSaving} disabled={candidate === null} />}
    >
      <View style={styles.stack}>
        <SizedText size={fontSizes.caption} weight={fontWeights.semibold} muted>
          {nutrition.calories}
        </SizedText>
        <View style={styles.calorieRow}>
          <RoundIconButton
            icon="remove"
            accessibilityLabel={strings.fewerCalories}
            onPress={() => form.stepCalories(ValueConstants.minusOne)}
            size={controlSizes.touchTarget}
            disabled={!NutritionGoals.canStepCalories(calories, ValueConstants.minusOne)}
          />
          <SuffixField
            value={form.values.calories}
            onChangeText={(value) => form.setField('calories', value)}
            accessibilityLabel={nutrition.calories}
            suffix={nutrition.kcal}
            numeric
            style={styles.calorieField}
            inputStyle={styles.calorieInput}
          />
          <RoundIconButton
            icon="add"
            accessibilityLabel={strings.moreCalories}
            onPress={() => form.stepCalories(ValueConstants.one)}
            size={controlSizes.touchTarget}
            disabled={!NutritionGoals.canStepCalories(calories, ValueConstants.one)}
          />
        </View>
        <GoalMacroRow label={nutrition.protein} value={form.values.protein} onChange={(v) => form.setField(NutritionMacro.Protein, v)} share={share(NutritionMacro.Protein)} />
        <GoalMacroRow label={nutrition.carbs} value={form.values.carbs} onChange={(v) => form.setField(NutritionMacro.Carbs, v)} share={share(NutritionMacro.Carbs)} />
        <GoalMacroRow label={nutrition.fat} value={form.values.fat} onChange={(v) => form.setField(NutritionMacro.Fat, v)} share={share(NutritionMacro.Fat)} />
        <GoalMacroRow label={nutrition.fiber} value={form.values.fiber} onChange={(v) => form.setField(NutritionMacro.Fiber, v)} share={null} />
        {candidate === null ? null : (
          <SizedText size={fontSizes.small} muted ratio={lineHeights.normal}>
            {strings.goalsHint.replace('{n}', formatWholeNumber(candidate.macroCalories, locale))}
          </SizedText>
        )}
        {candidate?.macrosDisagreeWithCalories === true ? (
          <View style={[styles.warning, { backgroundColor: tones.over.bg }]} accessibilityRole="alert">
            <StatusMarker kind={StatusMarkerKind.Triangle} color={tones.over.fg} size={diarySizes.markerStrip} />
            <SizedText size={fontSizes.caption} weight={fontWeights.semibold} color={tones.over.fg} style={styles.warningText}>
              {strings.goalsWarning}
            </SizedText>
          </View>
        ) : null}
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  stack: { gap: spacing.sm },
  calorieRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm },
  calorieField: { flex: ValueConstants.one, minHeight: controlSizes.input },
  calorieInput: { fontSize: fontSizes.display, fontWeight: fontWeights.heavy, textAlign: 'center' },
  warning: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radii.lg },
  warningText: { flex: ValueConstants.one },
});
