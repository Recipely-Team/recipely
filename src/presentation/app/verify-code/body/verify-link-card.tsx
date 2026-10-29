import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useStore } from 'zustand';
import { useRouter } from 'expo-router';
import type { Failure } from '@core/failure';
import { RoutePaths } from '@presentation/base/constants';
import { useStores } from '@presentation/bootstrap/use-stores';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { FormBanner } from '@presentation/base/widgets/feedback/form-banner';
import { authFormMessage } from '@presentation/base/errors/auth-form-message';
import { PrimaryButton } from '@presentation/base/widgets/buttons/primary-button';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing } from '@presentation/base/theme';
import { useTranslations } from '@presentation/i18n';

export interface VerifyLinkCardProps {
  token: string;
}

/**
 * The verify screen opened from the email's "finish creating my account" link.
 *
 * @remarks
 * - **Finishes on arrival.** No code, no countdown: the link is the proof. On
 *   success the screen's own auth effect enters the app.
 * - **Sent once per token**, even when an effect runs twice (Strict Mode, a
 *   remount): the link is single-use, and a second send would race the first.
 * - **A dead link offers a fresh start**, since the pending sign-up it named is gone.
 */
export const VerifyLinkCard = ({ token }: VerifyLinkCardProps): React.JSX.Element => {
  const t = useTranslations();
  const colors = useTheme().colors;
  const router = useRouter();
  const { authStore } = useStores();
  const verifyRegistrationLink = useStore(authStore, (s) => s.verifyRegistrationLink);
  const [failure, setFailure] = useState<Failure | null>(null);
  const sentToken = useRef<string | null>(null);

  useEffect(() => {
    if (sentToken.current === token) return;
    sentToken.current = token;
    void verifyRegistrationLink(token).then(setFailure);
  }, [token, verifyRegistrationLink]);

  if (failure !== null) {
    return (
      <>
        <FormBanner message={authFormMessage(t, failure, {})} />
        <View style={styles.buttonRow}>
          <PrimaryButton label={t.verify.startAgain} onPress={() => router.replace(RoutePaths.register)} />
        </View>
      </>
    );
  }

  return (
    <View style={styles.progress} accessibilityRole="progressbar" accessibilityLabel={t.verify.linkFinishing}>
      <ActivityIndicator color={colors.primary} />
      <ThemedText variant="body" muted style={styles.progressLabel}>
        {t.verify.linkFinishing}
      </ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  buttonRow: {
    marginTop: spacing.lg,
  },
  progress: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  progressLabel: {
    textAlign: 'center',
  },
});
