import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { MealSlotType } from '@domain/diary/meal-slot';
import type { MealPlanEntryEntity } from '@domain/meal-plan/meal-plan-entry-entity';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { PlannedMealRow } from '@presentation/app/diary/items/plan/planned-meal-row';
import { formatWholeNumber } from '@presentation/base/utils/diary/format-whole-number';
import { planMealLabel } from '@presentation/base/utils/meal-plan/plan-meal-label';
import { borderWidths, fontSizes, fontWeights, iconSizes, mealPlanSizes, opacities, radii, shadows, spacing } from '@presentation/base/theme';
import { t, useLocale } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

export interface PlanSlotCardProps {
  meal: MealSlotType;
  entries: readonly MealPlanEntryEntity[];
  kcal: number;
  /** False on a day that has passed or is full: no "Add". */
  canAdd: boolean;
  onAdd: () => void;
  onOpen: (entry: MealPlanEntryEntity) => void;
  onStep: (entry: MealPlanEntryEntity, direction: number) => void;
  onOptions: (entry: MealPlanEntryEntity) => void;
}

/**
 * One meal slot of the selected day (design spec → Meal planner, Slot card):
 * the slot name, its kcal and an "Add" chip, then its planned meals — or a
 * dashed "Nothing planned · + Add" button when it is empty.
 */
export const PlanSlotCard = ({ meal, entries, kcal, canAdd, onAdd, onOpen, onStep, onOptions }: PlanSlotCardProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const locale = useLocale();
  const strings = t().mealPlan;
  const label = planMealLabel(meal);
  const isEmpty = entries.length === ValueConstants.zero;
  return (
    <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
      <View style={styles.header}>
        <SizedText size={mealPlanSizes.slotTitle} weight={fontWeights.bold} accessibilityRole="header">
          {label}
        </SizedText>
        {isEmpty ? null : (
          <SizedText size={fontSizes.caption} color={colors.textMuted} style={styles.kcal}>
            {`${formatWholeNumber(kcal, locale)} ${strings.kcal}`}
          </SizedText>
        )}
        <View style={styles.grow} />
        {canAdd && !isEmpty ? (
          <Pressable
            onPress={onAdd}
            accessibilityRole="button"
            accessibilityLabel={strings.addTo.replace('{slot}', label)}
            hitSlop={mealPlanSizes.stepperHitSlop}
            style={({ pressed }) => [styles.addChip, { backgroundColor: colors.chipBackground, opacity: pressed ? opacities.pressedSubtle : opacities.full }]}
          >
            <Ionicons name="add" size={iconSizes.md} color={colors.chipText} />
            <SizedText size={fontSizes.small} weight={fontWeights.bold} color={colors.chipText}>
              {strings.add}
            </SizedText>
          </Pressable>
        ) : null}
      </View>
      {isEmpty ? (
        <Pressable
          onPress={onAdd}
          disabled={!canAdd}
          accessibilityRole="button"
          accessibilityLabel={strings.addTo.replace('{slot}', label)}
          style={({ pressed }) => [
            styles.empty,
            { borderColor: colors.border, opacity: canAdd ? (pressed ? opacities.pressedSubtle : opacities.full) : opacities.inactive },
          ]}
        >
          <SizedText size={fontSizes.medium} color={colors.textMuted}>
            {strings.nothingPlanned}
          </SizedText>
          {canAdd ? (
            <SizedText size={fontSizes.medium} weight={fontWeights.bold} color={colors.primary}>
              {`+ ${strings.add}`}
            </SizedText>
          ) : null}
        </Pressable>
      ) : (
        <View>
          {entries.map((entry, index) => (
            <PlannedMealRow
              key={entry.id}
              entry={entry}
              first={index === ValueConstants.zero}
              onOpen={() => onOpen(entry)}
              onStep={(direction) => onStep(entry, direction)}
              onOptions={() => onOptions(entry)}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: { ...shadows.sm, borderRadius: radii.xl, borderWidth: borderWidths.hairline, paddingTop: spacing.md, paddingBottom: spacing.sm, gap: spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg },
  kcal: { fontVariant: ['tabular-nums'] },
  grow: { flex: ValueConstants.one },
  addChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    minHeight: mealPlanSizes.addChip,
    paddingHorizontal: spacing.md,
    borderRadius: radii.round,
  },
  empty: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: mealPlanSizes.emptySlotMin,
    marginHorizontal: spacing.md,
    marginBottom: spacing.xs,
    borderWidth: borderWidths.medium,
    borderStyle: 'dashed',
    borderRadius: radii.lg,
  },
});
