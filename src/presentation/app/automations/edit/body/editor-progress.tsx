import { StyleSheet, View } from 'react-native';
import { ValueConstants } from '@core/constants';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { AutomationMetrics } from '@presentation/base/widgets/instagram/automation-metrics';
import { radii, spacing } from '@presentation/base/theme';
import type { EditorStepType } from '@presentation/app/automations/edit/model/editor-step';
import { editorStepLabels } from '@presentation/app/automations/edit/model/editor-step-labels';

export interface EditorProgressProps {
  step: EditorStepType;
}

/** A phone's step progress (spec §3): four segments, filled up to the current step. */
export const EditorProgress = ({ step }: EditorProgressProps): React.JSX.Element => {
  const colors = useTheme().colors;
  return (
    <View style={styles.row} accessibilityRole="progressbar" accessibilityValue={{ now: step + ValueConstants.one, max: editorStepLabels().length }}>
      {editorStepLabels().map((label, index) => (
        <View key={label} style={[styles.segment, { backgroundColor: index <= step ? colors.primary : colors.border }]} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.xs, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  segment: { flex: ValueConstants.one, height: AutomationMetrics.progress, borderRadius: radii.round },
});
