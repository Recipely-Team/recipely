import { Linking, StyleSheet, View } from 'react-native';
import { Pressable } from '@presentation/base/widgets/buttons/pressable';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { PrimaryButton } from '@presentation/base/widgets/buttons/primary-button';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, fontWeights, controlSizes } from '@presentation/base/theme';
import { PRIVACY_POLICY_URL, TERMS_OF_USE_URL } from '@infrastructure/constants/api/api-hosts';
import { useTranslations } from '@presentation/i18n';
import { PaywallPhase } from '@presentation/app/premium/model/paywall-phase';

export interface PaywallActionsProps {
  phase: PaywallPhase;
  message: string | null;
  onContinue: () => void;
  onRestore: () => void;
  onClose: () => void;
}

const open = (url: string): void => {
  void Linking.openURL(url).catch(() => undefined);
};

/**
 * The paywall's pinned bottom: the error line, Continue, restore and "maybe later",
 * and the renewal terms Apple and Google require next to a subscription.
 *
 * @remarks
 * - **Without a store** (web, or the store did not answer) it says where to
 *   subscribe and keeps only "maybe later".
 */
export const PaywallActions = ({ phase, message, onContinue, onRestore, onClose }: PaywallActionsProps): React.JSX.Element => {
  const t = useTranslations();
  const colors = useTheme().colors;
  const isBusy = phase === PaywallPhase.Purchasing || phase === PaywallPhase.Restoring;
  const isUnavailable = phase === PaywallPhase.Unavailable;

  return (
    <View style={styles.block}>
      {message === null ? null : (
        <ThemedText variant="caption" style={[styles.center, { color: colors.danger }]} accessibilityRole="alert">
          {message}
        </ThemedText>
      )}
      {isUnavailable ? (
        <ThemedText variant="body" style={styles.center}>
          {t.premium.storeUnavailable}
        </ThemedText>
      ) : (
        <PrimaryButton
          label={phase === PaywallPhase.Purchasing ? t.premium.processing : t.premium.continue}
          onPress={onContinue}
          loading={phase === PaywallPhase.Purchasing}
          disabled={phase !== PaywallPhase.Ready}
        />
      )}
      <View style={styles.links}>
        {isUnavailable ? null : (
          <Pressable onPress={onRestore} disabled={isBusy} accessibilityRole="button" style={styles.link}>
            <ThemedText variant="body" style={[styles.linkText, { color: colors.primary }]}>
              {t.premium.restore}
            </ThemedText>
          </Pressable>
        )}
        <Pressable onPress={onClose} disabled={phase === PaywallPhase.Purchasing} accessibilityRole="button" style={styles.link}>
          <ThemedText variant="body" style={[styles.linkText, { color: colors.textSubtle }]}>
            {t.premium.maybeLater}
          </ThemedText>
        </Pressable>
      </View>
      <ThemedText variant="caption" style={[styles.center, { color: colors.textSubtle }]}>
        {t.premium.renewal}
      </ThemedText>
      <View style={styles.links}>
        <Pressable onPress={() => open(TERMS_OF_USE_URL)} accessibilityRole="link" style={styles.link}>
          <ThemedText variant="caption" style={[styles.linkText, { color: colors.primary }]}>
            {t.premium.terms}
          </ThemedText>
        </Pressable>
        <Pressable onPress={() => open(PRIVACY_POLICY_URL)} accessibilityRole="link" style={styles.link}>
          <ThemedText variant="caption" style={[styles.linkText, { color: colors.primary }]}>
            {t.premium.privacy}
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  block: { gap: spacing.sm },
  center: { textAlign: 'center' },
  links: { flexDirection: 'row', justifyContent: 'center', gap: spacing.lg },
  link: { minHeight: controlSizes.settingsRow, justifyContent: 'center', paddingHorizontal: spacing.sm },
  linkText: { fontWeight: fontWeights.semibold },
});
