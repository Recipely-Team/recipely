import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { MealSlot } from '@domain/diary/meal-slot';
import { BottomSheet } from '@presentation/base/widgets/sheets/bottom-sheet';
import { PrimaryButton } from '@presentation/base/widgets/buttons/primary-button';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { mealLabel } from '@presentation/base/utils/diary/meal-label';
import { upperCase } from '@presentation/i18n/upper-case';
import { borderWidths, controlSizes, fontSizes, fontWeights, iconSizes, mealPlanSizes, radii, spacing } from '@presentation/base/theme';
import { useTranslations } from '@presentation/i18n';
import { CharConstants, ValueConstants } from '@core/constants';
import { PlanWeekStep } from '@presentation/app/diary/model/plan/plan-week-step';
import type { UsePlanMyWeekResult } from '@presentation/app/diary/model/plan/use-plan-my-week-result';
import { PlanProposalRow } from '@presentation/app/diary/items/plan/plan-proposal-row';

export interface PlanMyWeekSheetProps {
  vm: UsePlanMyWeekResult;
  /** "Oct 5 – Oct 11", the week the draft fills. */
  rangeLabel: string;
  onBrowseRecipes: () => void;
}

/**
 * "Plan my week" (prototype: Import Review - Plan My Week board, §2). A bottom
 * sheet on mobile and a centred dialog on the web shell, through the shared
 * `BottomSheet` (rule 23): pick the meals, see the proposal, swap, shuffle,
 * add. With no saved, liked or own recipes it explains how to start instead.
 */
export const PlanMyWeekSheet = ({ vm, rangeLabel, onBrowseRecipes }: PlanMyWeekSheetProps): React.JSX.Element => {
  const t = useTranslations();
  const colors = useTheme().colors;
  const strings = t.mealPlan.planWeek;
  const chosen = Object.values(MealSlot).filter((meal) => vm.meals.has(meal));

  const footer = vm.emptyPool ? (
    <PrimaryButton label={strings.browse} onPress={onBrowseRecipes} />
  ) : vm.step === PlanWeekStep.Meals ? (
    <PrimaryButton label={strings.show} onPress={vm.showPlan} loading={vm.loading} disabled={vm.meals.size === ValueConstants.zero} />
  ) : (
    <View style={styles.footerRow}>
      <Pressable
        onPress={vm.shuffle}
        disabled={vm.loading || vm.adding}
        style={[styles.ghost, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}
        accessibilityRole="button"
        accessibilityLabel={strings.shuffle}
      >
        <SizedText size={fontSizes.body} weight={fontWeights.bold}>{strings.shuffle}</SizedText>
      </Pressable>
      <View style={styles.grow}>
        <PrimaryButton
          label={strings.add.replace('{n}', String(vm.addCount))}
          onPress={vm.add}
          loading={vm.adding}
          disabled={vm.addCount === ValueConstants.zero || vm.loading}
        />
      </View>
    </View>
  );

  return (
    <BottomSheet visible={vm.visible} title={strings.title} onClose={vm.close} showCloseButton dialogMaxWidth={mealPlanSizes.shopDialogMaxWidth} footer={footer}>
      {vm.emptyPool ? (
        <View style={styles.emptyPool}>
          <View style={[styles.disc, { backgroundColor: colors.chipBackground }]}>
            <Ionicons name="bookmark-outline" size={iconSizes.lg} color={colors.primary} />
          </View>
          <SizedText size={fontSizes.title} weight={fontWeights.bold} style={styles.center}>{strings.emptyTitle}</SizedText>
          <SizedText size={fontSizes.body} color={colors.textMuted} style={styles.center}>{strings.emptyBody}</SizedText>
        </View>
      ) : vm.step === PlanWeekStep.Meals ? (
        <View style={styles.stack}>
          <SizedText size={fontSizes.body} color={colors.textMuted}>{strings.lead.replace('{range}', rangeLabel)}</SizedText>
          <SizedText size={fontSizes.tiny} weight={fontWeights.bold} color={colors.textMuted}>{upperCase(strings.label)}</SizedText>
          <View style={styles.chips}>
            {Object.values(MealSlot).map((meal) => {
              const isOn = vm.meals.has(meal);
              return (
                <Pressable
                  key={meal}
                  onPress={() => vm.toggleMeal(meal)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isOn }}
                  accessibilityLabel={mealLabel(t, meal)}
                  style={[
                    styles.chip,
                    isOn ? { backgroundColor: colors.primary, borderColor: colors.primary } : { borderColor: colors.border },
                  ]}
                >
                  {isOn ? <Ionicons name="checkmark" size={iconSizes.sm} color={colors.primaryText} /> : null}
                  <SizedText size={fontSizes.body} weight={isOn ? fontWeights.bold : fontWeights.semibold} color={isOn ? colors.primaryText : colors.text}>
                    {mealLabel(t, meal)}
                  </SizedText>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : (
        <View style={styles.stack}>
          <View style={styles.summary}>
            <SizedText size={fontSizes.caption} color={colors.textMuted} style={styles.grow}>
              {[rangeLabel, chosen.map((meal) => mealLabel(t, meal)).join(CharConstants.commaSpace)].join(CharConstants.middotSpaced)}
            </SizedText>
            <Pressable onPress={vm.change} accessibilityRole="button" accessibilityLabel={strings.change}>
              <SizedText size={fontSizes.body} weight={fontWeights.bold} color={colors.primary}>{strings.change}</SizedText>
            </Pressable>
          </View>
          {vm.loading ? <ActivityIndicator color={colors.primary} /> : null}
          {!vm.loading && vm.days.length === ValueConstants.zero ? (
            <SizedText size={fontSizes.body} color={colors.textMuted} style={styles.center}>{strings.nothing}</SizedText>
          ) : null}
          {vm.days.map((day) => (
            <View key={day.key} style={styles.day}>
              <SizedText size={fontSizes.tiny} weight={fontWeights.bold} color={colors.textMuted}>{upperCase(day.label)}</SizedText>
              {day.rows.map((row) => (
                <PlanProposalRow key={row.key} row={row} onSwap={vm.toggleSwap} />
              ))}
            </View>
          ))}
        </View>
      )}
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  stack: { gap: spacing.lg },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: mealPlanSizes.ghostWeb,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.round,
    borderWidth: borderWidths.thin,
  },
  summary: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  day: { gap: spacing.sm },
  footerRow: { flexDirection: 'row', gap: spacing.sm2 },
  ghost: {
    flex: ValueConstants.one,
    minHeight: controlSizes.buttonSm,
    borderRadius: radii.lg,
    borderWidth: borderWidths.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grow: { flex: ValueConstants.one },
  emptyPool: { alignItems: 'center', gap: spacing.sm2, paddingTop: spacing.lg },
  disc: { width: mealPlanSizes.lockDisc, height: mealPlanSizes.lockDisc, borderRadius: radii.round, alignItems: 'center', justifyContent: 'center' },
  center: { textAlign: 'center', maxWidth: mealPlanSizes.emptyBodyMaxWidth },
});
