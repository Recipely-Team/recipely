import { useEffect } from 'react';
import { useStore } from 'zustand';
import { isString } from '@core/guards/type-guards';
import { StoreStatus } from '@application/store/store-status';
import { Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { resolveRedirect } from '@presentation/navigation/resolve-redirect';
import { useGoBackOrHome } from '@presentation/base/hooks/navigation/use-go-back-or-home';
import { useStores } from '@presentation/bootstrap/use-stores';
import { HeroCardShell } from '@presentation/base/widgets/layout/hero-card-shell';
import { VerifyHero } from '@presentation/app/verify-code/body/verify-hero';
import { VerifyCodeCard } from '@presentation/app/verify-code/body/verify-code-card';
import { VerifyLinkCard } from '@presentation/app/verify-code/body/verify-link-card';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, iconSizes, controlSizes, mediaSizes, decorSizes, zIndices } from '@presentation/base/theme';
import { useTranslations } from '@presentation/i18n';
import { CharConstants, ValueConstants } from '@core/constants';
import { RoutePaths } from '@presentation/base/constants';
import { enterApp } from '@presentation/navigation/enter-app';

export const VerifyCodeScreen = (): React.JSX.Element => {
  const t = useTranslations();
  const router = useRouter();
  const goBack = useGoBackOrHome(RoutePaths.login);
  const colors = useTheme().colors;

  const params = useLocalSearchParams<{ email?: string; expiresAt?: string; redirect?: string; token?: string }>();
  // Opened from the email's link: finish from the token, no code to type.
  const linkToken = isString(params.token) && params.token.length > ValueConstants.zero ? params.token : null;
  const email = isString(params.email) ? params.email : CharConstants.empty;
  const initialExpiresAt = isString(params.expiresAt) ? params.expiresAt : CharConstants.empty;
  const isLinkMode = linkToken !== null;

  const { authStore } = useStores();
  const authStatus = useStore(authStore, (s) => s.state.status);

  useEffect(() => {
    if (authStatus === StoreStatus.Authenticated) {
    // The sign-up detour is spent: replace the stack.
      enterApp(router, resolveRedirect(params.redirect) as Href);
    }
  }, [authStatus, router, params.redirect]);

  return (
    <HeroCardShell
      splitHero={<VerifyHero isLandscapeShell email={email} isLinkMode={isLinkMode} />}
      stackedHeader={
        <>
          <LinearGradient
            colors={[colors.primaryGradientStart, colors.primaryGradientEnd]}
            start={{ x: ValueConstants.zero, y: ValueConstants.zero }}
            end={{ x: ValueConstants.one, y: ValueConstants.one }}
            style={styles.gradient}
          />
          <Pressable
            onPress={goBack}
            style={[styles.backBtn, { backgroundColor: colors.gradientSurface }]}
            accessibilityRole="button"
            accessibilityLabel={t.verify.changeEmail}
          >
            <Ionicons name="chevron-back" size={iconSizes.xl} color={colors.onOverlay} />
          </Pressable>
          <VerifyHero isLandscapeShell={false} email={email} isLinkMode={isLinkMode} />
        </>
      }
      stackedCardStyle={styles.card}
    >
      {linkToken !== null ? <VerifyLinkCard token={linkToken} /> : <VerifyCodeCard email={email} initialExpiresAt={initialExpiresAt} />}
    </HeroCardShell>
  );
};

const styles = StyleSheet.create({
  gradient: {
    position: 'absolute',
    top: ValueConstants.zero,
    left: ValueConstants.zero,
    right: ValueConstants.zero,
    height: mediaSizes.heroImageHeight,
    borderBottomLeftRadius: radii.xxxl,
    borderBottomRightRadius: radii.xxxl,
  },
  backBtn: {
    position: 'absolute',
    top: spacing.xxxl,
    left: spacing.lg,
    width: controlSizes.iconBtn,
    height: controlSizes.iconBtn,
    borderRadius: radii.round,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: zIndices.raised,
  },
  card: {
    marginTop: -decorSizes.cardOverlap,
    marginBottom: spacing.xxl,
  },
});

export default VerifyCodeScreen;
