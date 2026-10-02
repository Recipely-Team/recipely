import { useEffect, useRef } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { isWeb } from '@infrastructure/constants/platform';
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
 * - **Web finishes here.** The login ran in this tab, so the return link's
 *   `status` / `code` are read from the URL, the link is finished once, and
 *   the user lands on Edit Profile's creator section.
 * - **A phone never finishes here.** The auth session already took the link
 *   and finished it; Android can still route the same link here, so this
 *   steps back to where the user was rather than finishing a spent code twice.
 */
export const InstagramConnectedScreen = (): React.JSX.Element => {
  const router = useRouter();
  const colors = useTheme().colors;
  const params = useLocalSearchParams<{ status?: string; code?: string; reason?: string }>();
  const finalize = useInstagramFinalize();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;
    if (!isWeb()) {
      if (router.canGoBack()) router.back();
      else router.replace(RoutePaths.editProfileCreatorAccount);
      return;
    }
    const outcome = readInstagramReturn(params);
    const done = (): void => router.replace(RoutePaths.editProfileCreatorAccount);
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
  }, [finalize, params, router]);

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
