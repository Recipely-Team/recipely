import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { ValueConstants } from '@core/constants';
import type { MealSlotType } from '@domain/diary/meal-slot';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { PickMessage } from '@presentation/base/widgets/diary/add-food/pick/pick-message';
import { MealComposeForm } from '@presentation/base/widgets/diary/add-food/meal/meal-compose-form';
import { MealConfirmList } from '@presentation/base/widgets/diary/add-food/meal/meal-confirm-list';
import { MealLogPhase } from '@presentation/base/widgets/diary/add-food/meal/state/meal-log-phase';
import type { MealLog } from '@presentation/base/widgets/diary/add-food/meal/state/meal-log';
import { MealFailureAction } from '@presentation/base/widgets/diary/add-food/meal/state/meal-failure-action';
import { mealFailureActionFor } from '@presentation/base/widgets/diary/add-food/meal/state/meal-failure-action-for';
import { mealFailureContent } from '@presentation/base/widgets/diary/add-food/meal/state/meal-failure-content';
import { diarySizes, fontSizes, spacing } from '@presentation/base/theme';
import { t } from '@presentation/i18n';

export interface MealLogBodyProps {
  log: MealLog;
  meal: MealSlotType;
  isSubmitting: boolean;
}

/**
 * "Describe or photograph your meal" inside the Add food sheet: the form, a
 * spinner while the parser reads, a failure with the one action that helps
 * (none for the daily limit or an unavailable service), or the confirm list.
 */
export const MealLogBody = ({ log, meal, isSubmitting }: MealLogBodyProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const strings = t().diary;
  const { state } = log;
  switch (state.phase) {
    case MealLogPhase.Compose:
      return <MealComposeForm log={log} />;
    case MealLogPhase.Parsing:
      return (
        <View style={styles.center} accessibilityLiveRegion="polite">
          <ActivityIndicator color={colors.primary} />
          <SizedText size={fontSizes.caption} muted>
            {strings.mealLogParsing}
          </SizedText>
        </View>
      );
    case MealLogPhase.Failed: {
      const content = mealFailureContent(state.failure);
      const action = mealFailureActionFor(state.failure);
      return (
        <PickMessage
          title={content.title}
          hint={content.body}
          action={
            action === MealFailureAction.None
              ? null
              : action === MealFailureAction.Retry
                ? { label: t().errors.retry, icon: 'refresh', onPress: log.retry }
                : { label: strings.mealLogEdit, icon: 'refresh', onPress: log.edit }
          }
        />
      );
    }
    case MealLogPhase.Review:
      if (state.rows.length === ValueConstants.zero) {
        return (
          <PickMessage
            title={strings.mealLogNothing}
            hint={strings.mealLogNothingHint}
            action={{ label: strings.mealLogStartOver, icon: 'refresh', onPress: log.edit }}
          />
        );
      }
      return <MealConfirmList log={log} rows={state.rows} note={state.note} initialMeal={meal} isSubmitting={isSubmitting} />;
  }
};

const styles = StyleSheet.create({
  center: { minHeight: diarySizes.pickBodyMinHeight, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
});
