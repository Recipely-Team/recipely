import { ScrollView, StyleSheet, View } from 'react-native';
import type { LoggableFood } from '@domain/diary/entry/loggable-food';
import type { MealSlotType } from '@domain/diary/meal-slot';
import { useQuickAddForm } from '@presentation/base/hooks/diary/use-quick-add-form';
import { SuffixField } from '@presentation/base/widgets/diary/suffix-field';
import { MealPicker } from '@presentation/base/widgets/diary/add-food/meal-picker';
import { PrimaryButton } from '@presentation/base/widgets/buttons/primary-button';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { formatWholeNumber } from '@presentation/base/utils/diary/format-whole-number';
import { fontSizes, fontWeights, spacing } from '@presentation/base/theme';
import { t, useLocale } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

export interface QuickAddFormViewProps {
  initialMeal: MealSlotType;
  /** Pre-filled from a search that found nothing. */
  initialName: string;
  isSubmitting: boolean;
  onSubmit: (food: LoggableFood, meal: MealSlotType) => void;
}

/** The Quick add tab: a name, kcal and optional macros, logged in one step; scrolls on its own inside the sheet. */
export const QuickAddFormView = ({ initialMeal, initialName, isSubmitting, onSubmit }: QuickAddFormViewProps): React.JSX.Element => {
  const locale = useLocale();
  const form = useQuickAddForm(initialMeal, initialName);
  const strings = t().diary;
  const nutrition = t().nutrition;
  const food = form.food;
  const macroFields = [
    { key: 'protein', label: nutrition.protein, value: form.protein, onChange: form.setProtein },
    { key: 'carbs', label: nutrition.carbs, value: form.carbs, onChange: form.setCarbs },
    { key: 'fat', label: nutrition.fat, value: form.fat, onChange: form.setFat },
  ];

  return (
    <ScrollView contentContainerStyle={styles.stack} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <SizedText size={fontSizes.caption} weight={fontWeights.semibold} muted>
        {strings.quickName}
      </SizedText>
      <SuffixField value={form.name} onChangeText={form.setName} accessibilityLabel={strings.quickName} placeholder={strings.quickNamePlaceholder} />
      <SizedText size={fontSizes.caption} weight={fontWeights.semibold} muted>
        {nutrition.calories}
      </SizedText>
      <SuffixField value={form.calories} onChangeText={form.setCalories} accessibilityLabel={nutrition.calories} suffix={nutrition.kcal} numeric />
      <View style={styles.macroRow}>
        {macroFields.map((field) => (
          <View key={field.key} style={styles.macro}>
            <SizedText size={fontSizes.small} weight={fontWeights.semibold} muted>
              {field.label}
            </SizedText>
            <SuffixField value={field.value} onChangeText={field.onChange} accessibilityLabel={field.label} suffix={nutrition.g} numeric />
          </View>
        ))}
      </View>
      {form.macroCalories === null ? null : (
        <SizedText size={fontSizes.small} muted>
          {strings.quickMacroHint.replace('{n}', formatWholeNumber(form.macroCalories, locale))}
        </SizedText>
      )}
      <SizedText size={fontSizes.caption} weight={fontWeights.semibold} muted>
        {strings.meal}
      </SizedText>
      <MealPicker value={form.meal} onChange={form.setMeal} />
      <View style={styles.submit}>
        <PrimaryButton
          label={strings.addToDiaryKcal.replace('{k}', formatWholeNumber(food?.perServing.calories ?? ValueConstants.zero, locale))}
          onPress={() => {
            if (food !== null) onSubmit(food, form.meal);
          }}
          disabled={food === null}
          loading={isSubmitting}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  stack: { gap: spacing.sm, paddingTop: spacing.md },
  macroRow: { flexDirection: 'row', gap: spacing.sm },
  macro: { flex: ValueConstants.one, gap: spacing.xs },
  submit: { marginTop: spacing.sm },
});
