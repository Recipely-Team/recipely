import { View } from 'react-native';
import { BottomSheet } from '@presentation/base/widgets/sheets/bottom-sheet';
import { PlanActionRow } from '@presentation/app/diary/items/plan/plan-action-row';
import { t } from '@presentation/i18n';

export interface WeekMenuSheetProps {
  visible: boolean;
  /** False for an empty week: nothing to clear. */
  canClear: boolean;
  onClose: () => void;
  onCopyLastWeek: () => void;
  onClearWeek: () => void;
}

/**
 * The week's ⋯ menu (design spec → Meal planner, Week actions): Copy last
 * week, Clear week. A bottom sheet on a phone; the shared sheet becomes a
 * centred dialog on the web, where the prototype draws a 230-wide popover —
 * the codebase has no popover widget, and rule 23 keeps menus in the sheet.
 */
export const WeekMenuSheet = ({ visible, canClear, onClose, onCopyLastWeek, onClearWeek }: WeekMenuSheetProps): React.JSX.Element => {
  const strings = t().mealPlan;
  const run = (action: () => void) => (): void => {
    onClose();
    action();
  };
  return (
    <BottomSheet visible={visible} title={strings.weekOptions} onClose={onClose}>
      <View>
        <PlanActionRow icon="copy-outline" label={strings.copyLastWeek} onPress={run(onCopyLastWeek)} />
        {canClear ? <PlanActionRow icon="trash-outline" label={strings.clearWeek} onPress={run(onClearWeek)} danger /> : null}
      </View>
    </BottomSheet>
  );
};
