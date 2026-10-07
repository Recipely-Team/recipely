import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ValueConstants } from '@core/constants';
import type { MealSlotType } from '@domain/diary/meal-slot';
import { MealParseNote, type MealParseNoteType } from '@domain/diary/meal/meal-parse-note';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { PrimaryButton } from '@presentation/base/widgets/buttons/primary-button';
import { MealPicker } from '@presentation/base/widgets/diary/add-food/meal-picker';
import { MealCandidateRow } from '@presentation/base/widgets/diary/add-food/meal/meal-candidate-row';
import type { MealLog } from '@presentation/base/widgets/diary/add-food/meal/state/meal-log';
import type { MealReviewRow } from '@presentation/base/widgets/diary/add-food/meal/state/meal-review-row';
import { formatWholeNumber } from '@presentation/base/utils/diary/format-whole-number';
import { controlSizes, fontSizes, fontWeights, iconSizes, opacities, radii, spacing } from '@presentation/base/theme';
import { t, useLocale } from '@presentation/i18n';

export interface MealConfirmListProps {
  log: MealLog;
  rows: readonly MealReviewRow[];
  note: MealParseNoteType | null;
  initialMeal: MealSlotType;
  isSubmitting: boolean;
}

/**
 * The meal panel's confirm list: what the parser found, each row tickable and
 * its grams editable, the meal to log into, and "Add to diary" for the ticked
 * rows. The estimate line is always on screen — the figures are never
 * presented as measured.
 */
export const MealConfirmList = ({ log, rows, note, initialMeal, isSubmitting }: MealConfirmListProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const locale = useLocale();
  const strings = t().diary;
  const [meal, setMeal] = useState(initialMeal);
  const addLabel = strings.mealLogAdd
    .replace('{n}', formatWholeNumber(log.selectedCount, locale))
    .replace('{k}', formatWholeNumber(log.selectedCalories, locale));
  return (
    <ScrollView contentContainerStyle={styles.stack} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <View style={[styles.note, { backgroundColor: colors.warningLight }]}>
        <Ionicons name="information-circle-outline" size={iconSizes.lg} color={colors.text} />
        <SizedText size={fontSizes.small} style={styles.noteText}>
          {note === MealParseNote.SomeEstimated ? `${strings.mealLogDisclaimer} ${strings.mealLogSomeEstimated}` : strings.mealLogDisclaimer}
        </SizedText>
      </View>
      <View>
        {rows.map((row) => (
          <MealCandidateRow key={row.key} row={row} onToggle={log.toggle} onGramsChange={log.setGrams} />
        ))}
      </View>
      <SizedText size={fontSizes.caption} weight={fontWeights.semibold} muted>
        {strings.meal}
      </SizedText>
      <MealPicker value={meal} onChange={setMeal} />
      <PrimaryButton label={addLabel} onPress={() => void log.add(meal)} disabled={log.selectedCount === ValueConstants.zero} loading={isSubmitting} />
      <Pressable
        onPress={log.edit}
        accessibilityRole="button"
        style={({ pressed }) => [styles.startOver, { opacity: pressed ? opacities.pressedSubtle : opacities.full }]}
      >
        <SizedText size={fontSizes.caption} weight={fontWeights.bold} color={colors.primary}>
          {strings.mealLogStartOver}
        </SizedText>
      </Pressable>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  stack: { gap: spacing.sm, paddingTop: spacing.md },
  note: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, padding: spacing.sm2, borderRadius: radii.md },
  noteText: { flex: ValueConstants.one },
  startOver: { alignSelf: 'center', justifyContent: 'center', minHeight: controlSizes.touchTarget, paddingHorizontal: spacing.lg },
});
