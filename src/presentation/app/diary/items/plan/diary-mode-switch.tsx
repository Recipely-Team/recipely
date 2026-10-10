import { StyleSheet, View } from 'react-native';
import { SegmentedTabs } from '@presentation/base/widgets/diary/segmented-tabs';
import { DiaryMode, type DiaryModeType } from '@presentation/app/diary/model/plan/diary-mode';
import { mealPlanSizes } from '@presentation/base/theme';
import { t } from '@presentation/i18n';

export interface DiaryModeSwitchProps {
  mode: DiaryModeType;
  onChange: (mode: DiaryModeType) => void;
  /** Web: 200 wide beside the page title; phone: full width under the app bar. */
  wide: boolean;
}

/** Plan | Log at the top of the Diary tab (design spec → Meal planner, Route & entry points). */
export const DiaryModeSwitch = ({ mode, onChange, wide }: DiaryModeSwitchProps): React.JSX.Element => {
  const strings = t().mealPlan;
  return (
    <View style={wide ? styles.wide : null} accessibilityLabel={strings.modeA11y}>
      <SegmentedTabs
        options={[
          { key: DiaryMode.Plan, label: strings.modePlan },
          { key: DiaryMode.Log, label: strings.modeLog },
        ]}
        value={mode}
        onChange={onChange}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wide: { width: mealPlanSizes.modeSwitchWebWidth, alignSelf: 'flex-end' },
});
