import { useEffect } from 'react';
import { useStore } from 'zustand';
import { StoreStatus } from '@application/store/store-status';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { useStores } from '@presentation/bootstrap/use-stores';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { HeroCardShell } from '@presentation/base/widgets/layout/hero-card-shell';
import { LoginHero } from '@presentation/app/login/body/login-hero';
import { LoginForm } from '@presentation/app/login/body/login-form';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii } from '@presentation/base/theme';
import { useTranslations } from '@presentation/i18n';
import { resolveRedirect } from '@presentation/navigation/resolve-redirect';
import { ValueConstants } from '@core/constants';

export const LoginScreen = (): React.JSX.Element => {
  const t = useTranslations();
  const router = useRouter();
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();
  const colors = useTheme().colors;

  const { authStore } = useStores();
  const authStatus = useStore(authStore, (s) => s.state.status);

  useEffect(() => {
    if (authStatus === StoreStatus.Authenticated) {
      router.replace(resolveRedirect(redirect) as Href);
    }
  }, [authStatus, router, redirect]);

  return (
    <HeroCardShell
      splitHero={<LoginHero isLandscapeShell />}
      stackedHeader={
        <>
          <LinearGradient
            colors={[colors.primaryGradientStart, colors.primaryGradientEnd]}
            start={{ x: ValueConstants.zero, y: ValueConstants.zero }}
            end={{ x: ValueConstants.one, y: ValueConstants.one }}
            style={styles.gradient}
          />
          <LoginHero isLandscapeShell={false} />
        </>
      }
      stackedCardStyle={styles.card}
      footer={
        t.login.hint ? (
          <ThemedText variant="caption" muted style={styles.hint}>
            {t.login.hint}
          </ThemedText>
        ) : null
      }
    >
      <LoginForm />
    </HeroCardShell>
  );
};

const styles = StyleSheet.create({
  gradient: {
    position: 'absolute',
    top: ValueConstants.zero,
    left: ValueConstants.zero,
    right: ValueConstants.zero,
    height: '40%',
    borderBottomLeftRadius: radii.xxxl,
    borderBottomRightRadius: radii.xxxl,
  },
  card: {
    marginTop: '10%',
  },
  hint: {
    marginTop: spacing.lg,
    textAlign: 'center',
  },
});

export default LoginScreen;
