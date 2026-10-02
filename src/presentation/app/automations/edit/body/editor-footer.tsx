import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ValueConstants } from '@core/constants';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { useLayout } from '@presentation/base/responsive/use-layout';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { PrimaryButton } from '@presentation/base/widgets/buttons/primary-button';
import { AutomationMetrics } from '@presentation/base/widgets/instagram/automation-metrics';
import { borderWidths, fontSizes, fontWeights, radii, spacing } from '@presentation/base/theme';
import { t } from '@presentation/i18n';

export interface EditorFooterProps {
  isLast: boolean;
  canContinue: boolean;
  isSaving: boolean;
  onBack: () => void;
  onNext: () => void;
}

/** The editor's pinned actions (spec §3): Back, and Next — or Save on the last step — disabled until the step is valid. */
export const EditorFooter = ({ isLast, canContinue, isSaving, onBack, onNext }: EditorFooterProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const insets = useSafeAreaInsets();
  const { isWebShell } = useLayout();
  const copy = t().instagram;
  return (
    <View style={[styles.footer, { borderTopColor: colors.border, paddingBottom: (isWebShell ? ValueConstants.zero : insets.bottom) + spacing.md }]}>
      <Pressable onPress={onBack} accessibilityRole="button" style={[styles.back, { borderColor: colors.cardBorder }]}>
        <SizedText size={fontSizes.body} weight={fontWeights.bold}>
          {copy.back}
        </SizedText>
      </Pressable>
      <View style={styles.next}>
        <PrimaryButton label={isLast ? copy.save : copy.next} onPress={onNext} disabled={!canContinue} loading={isSaving} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  footer: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingTop: spacing.md, borderTopWidth: borderWidths.hairline },
  back: { minHeight: AutomationMetrics.connectButton, paddingHorizontal: spacing.lg, borderRadius: radii.round, borderWidth: borderWidths.hairline, justifyContent: 'center' },
  next: { flex: ValueConstants.one },
});
