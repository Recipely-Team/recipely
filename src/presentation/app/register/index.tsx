import { useEffect } from 'react';
import { useStore } from 'zustand';
import { StoreStatus } from '@application/store/store-status';
import { Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { resolveRedirect } from '@presentation/navigation/resolve-redirect';
import { useGoBackOrHome } from '@presentation/base/hooks/navigation/use-go-back-or-home';
import { useStores } from '@presentation/bootstrap/use-stores';
import { HeroCardShell } from '@presentation/base/widgets/layout/hero-card-shell';
import { RegisterHero } from '@presentation/app/register/body/register-hero';
import { RegisterForm } from '@presentation/app/register/body/register-form';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, iconSizes, controlSizes, decorSizes, borderWidths, zIndices } from '@presentation/base/theme';
import { ValueConstants } from '@core/constants';
import { RoutePaths } from '@presentation/base/constants';
import { enterApp } from '@presentation/navigation/enter-app';
import { useTranslations } from '@presentation/i18n';

export const RegisterScreen = (): React.JSX.Element => {
  const t = useTranslations();
  const router = useRouter();
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();
  const goBack = useGoBackOrHome(RoutePaths.login);
  const colors = useTheme().colors;

  const { authStore } = useStores();
  const authStatus = useStore(authStore, (s) => s.state.status);

  useEffect(() => {
    if (authStatus === StoreStatus.Authenticated) {
    // One-way: the form and login must not stay behind a back gesture.
      enterApp(router, resolveRedirect(redirect) as Href);
    }
  }, [authStatus, router, redirect]);

  return (
    <HeroCardShell
      splitHero={<RegisterHero isLandscapeShell />}
      stackedHeader={
        <>
          <LinearGradient
            colors={[colors.primaryGradientStart, colors.primaryGradientEnd]}
            start={{ x: ValueConstants.zero, y: ValueConstants.zero }}
            end={{ x: ValueConstants.one, y: ValueConstants.one }}
            style={styles.gradient}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.common.back}
            onPress={goBack}
            style={[styles.backButton, { backgroundColor: colors.gradientSurface, borderColor: colors.gradientBorder }]}
          >
            <Ionicons name="chevron-back" size={iconSizes.xl} color={colors.onOverlay} />
          </Pressable>
          <RegisterHero isLandscapeShell={false} />
        </>
      }
      stackedCardStyle={styles.card}
    >
      <RegisterForm />
    </HeroCardShell>
  );
};

const styles = StyleSheet.create({
  gradient: {
    position: 'absolute',
    top: ValueConstants.zero,
    left: ValueConstants.zero,
    right: ValueConstants.zero,
    height: decorSizes.gradientHeight,
    borderBottomLeftRadius: radii.xxxl,
    borderBottomRightRadius: radii.xxxl,
  },
  backButton: {
    position: 'absolute',
    top: controlSizes.tabBar,
    left: spacing.lg,
    width: controlSizes.iconBtn,
    height: controlSizes.iconBtn,
    borderRadius: radii.round,
    borderWidth: borderWidths.hairline,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: zIndices.raised,
  },
  card: {
    marginTop: -decorSizes.cardOverlap,
  },
});

export default RegisterScreen;
