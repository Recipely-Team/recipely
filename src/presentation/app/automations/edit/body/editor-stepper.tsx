import { useTranslations } from '@presentation/i18n';
import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ValueConstants } from '@core/constants';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { AutomationMetrics } from '@presentation/base/widgets/instagram/automation-metrics';
import { controlSizes, fontSizes, fontWeights, iconSizes, opacities, radii, spacing } from '@presentation/base/theme';
import type { EditorStepType } from '@presentation/app/automations/edit/model/editor-step';
import { editorStepLabels } from '@presentation/app/automations/edit/model/editor-step-labels';
import { EDITOR_STEPS } from '@presentation/app/automations/edit/model/editor-steps';

export interface EditorStepperProps {
  step: EditorStepType;
  stepValid: readonly boolean[];
  onGoTo: (step: EditorStepType) => void;
}

/**
 * The expanded viewport's vertical stepper (spec §3 → Web): numbered dots
 * that turn into checks once done; back freely, forward only past valid steps.
 */
export const EditorStepper = ({ step, stepValid, onGoTo }: EditorStepperProps): React.JSX.Element => {
  const t = useTranslations();
  const colors = useTheme().colors;
  return (
    <View style={styles.column}>
      {EDITOR_STEPS.map((target, index) => {
        const label = editorStepLabels(t)[index];
        const isCurrent = index === step;
        const isReachable = index <= step || stepValid.slice(ValueConstants.zero, index).every(Boolean);
        const isDone = index < step && stepValid[index] === true;
        return (
          <Pressable
            key={label}
            onPress={() => onGoTo(target)}
            disabled={!isReachable}
            accessibilityRole="button"
            accessibilityState={{ selected: isCurrent, disabled: !isReachable }}
            style={[styles.item, { opacity: isReachable ? opacities.full : AutomationMetrics.disabledOpacity }]}
          >
            <View style={[styles.dot, { backgroundColor: isCurrent || isDone ? colors.primary : colors.chipBackground }]}>
              {isDone ? (
                <Ionicons name="checkmark" size={iconSizes.sm} color={colors.primaryText} />
              ) : (
                <SizedText size={fontSizes.small} weight={fontWeights.bold} color={isCurrent ? colors.primaryText : colors.chipText}>
                  {String(index + ValueConstants.one)}
                </SizedText>
              )}
            </View>
            <SizedText size={fontSizes.medium} weight={isCurrent ? fontWeights.bold : fontWeights.regular}>
              {label}
            </SizedText>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  column: { width: AutomationMetrics.stepperWidth, gap: spacing.xs },
  item: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: controlSizes.touchTarget },
  dot: { width: controlSizes.checkbox, height: controlSizes.checkbox, borderRadius: radii.round, alignItems: 'center', justifyContent: 'center' },
});
