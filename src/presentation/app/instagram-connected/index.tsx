import { useEffect, useRef } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { isWeb } from '@infrastructure/constants/platform';
import { StoreStatus } from '@application/store/store-status';
import { useStores } from '@presentation/bootstrap/use-stores';
import { InstagramLoginInFlight } from '@presentation/base/utils/instagram/instagram-login-in-flight';
import { readInstagramReturn } from '@domain/instagram/connect/read-instagram-return';
import { InstagramReturnKind } from '@domain/instagram/connect/instagram-return-kind';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { useInstagramFinalize } from '@presentation/base/hooks/instagram/use-instagram-finalize';
import { showWarningToast } from '@presentation/base/feedback/show-toast';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { PageTitle } from '@presentation/base/widgets/head/page-title';
import { RoutePaths } from '@presentation/base/constants';
import { fontSizes, spacing } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

/**
 * Where Instagram's login sends the user back (backend #374 → returnTo).
 *
 * @remarks
 * - **Web finishes here, once signed in.** The login ran in this tab, so the
 *   return link's `status` / `code` are read from the URL and the link is
 *   finished once — after the session is restored, since the code belongs to
 *   that user — and the user lands on Edit Profile's creator section.
 * - **A phone never finishes here.** The auth session already took the link
 *   and finished it; Android can still route the same link here, so this
 *   steps back to where the user was rather than finishing a spent code twice.
 *   With no login open (a cold start), it says the login did not finish.
 */
export const InstagramConnectedScreen = (): React.JSX.Element => {
  const router = useRouter();
  const colors = useTheme().colors;
  const params = useLocalSearchParams<{ status?: string; code?: string; reason?: string }>();
  const { authStore } = useStores();
  const authStatus = authStore((s) => s.state.status);
  const finalize = useInstagramFinalize();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    const outcome = readInstagramReturn(params);
    if (!isWeb()) {
      handled.current = true;
      // No login open here: a cold start reached by the return link. Its code is never finalized here.
      if (!InstagramLoginInFlight.isOpen && outcome.kind === InstagramReturnKind.Authorized) showWarningToast(t().instagram.loginNotFinished);
      if (router.canGoBack()) router.back();
      else router.replace(RoutePaths.editProfileCreatorAccount);
      return;
    }
    // The code belongs to the signed-in user: wait until the session is restored.
    if (authStatus !== StoreStatus.Authenticated && authStatus !== StoreStatus.Unauthenticated) return;
    handled.current = true;
    const done = (): void => router.replace(RoutePaths.editProfileCreatorAccount);
    if (authStatus === StoreStatus.Unauthenticated) {
      showWarningToast(t().instagram.loginNotFinished);
      return done();
    }
    switch (outcome.kind) {
      case InstagramReturnKind.Authorized:
        void finalize(outcome.code).then(done);
        return;
      case InstagramReturnKind.Failed:
        showWarningToast(t().instagram.loginFailed);
        return done();
      case InstagramReturnKind.Denied:
      case InstagramReturnKind.Cancelled:
        showWarningToast(t().instagram.cancelled);
        return done();
    }
  }, [authStatus, finalize, params, router]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <PageTitle subject={t().instagram.connect} />
      <ActivityIndicator color={colors.primary} />
      <SizedText size={fontSizes.medium} muted>
        {t().instagram.finishing}
      </SizedText>
    </View>
  );
};

export default InstagramConnectedScreen;

const styles = StyleSheet.create({
  screen: { flex: ValueConstants.one, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
});
