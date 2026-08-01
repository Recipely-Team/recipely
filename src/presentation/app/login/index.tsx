import { useEffect } from 'react';
import { StoreStatus } from '@application/store/store-status';
import { ScrollView, StyleSheet, View } from 'react-native';
import { KeyboardAvoider } from '@presentation/base/widgets/layout/keyboard-avoider';
import { LinearGradient } from 'expo-linear-gradient';
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { useStores } from '@presentation/bootstrap/use-stores';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { LoginHero } from '@presentation/app/login/body/login-hero';
import { LoginForm } from '@presentation/app/login/body/login-form';
import { useLayout } from '@presentation/base/responsive/use-layout';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { shadows } from '@presentation/base/theme/tokens/effects/shadows';
import { spacing, radii } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { resolveRedirect } from '@presentation/app/login/model/resolve-redirect';
import { ValueConstants } from '@core/constants';
import { OrientationType } from '@presentation/base/responsive/orientation-type';

const AUTH_CARD_MAX_WIDTH = 460;

export const LoginScreen = (): React.JSX.Element => {
  const router = useRouter();
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();
  const colors = useTheme().colors;
  const { isWebShell, orientation } = useLayout();
  const isLandscapeShell = isWebShell && orientation === OrientationType.Landscape;

  const { authStore } = useStores();
  const state = authStore((s) => s.state);

  useEffect(() => {
    if (state.status === StoreStatus.Authenticated) {
      router.replace(resolveRedirect(redirect) as Href);
    }
  }, [state.status, router, redirect]);

  if (isLandscapeShell) {
    return (
      <KeyboardAvoider style={styles.flex}>
        <View style={[styles.splitRoot, { backgroundColor: colors.background }]}>
          <LinearGradient
            colors={[colors.primaryGradientStart, colors.primaryGradientEnd]}
            start={{ x: ValueConstants.zero, y: ValueConstants.zero }}
            end={{ x: ValueConstants.one, y: ValueConstants.one }}
            style={styles.splitHero}
          >
            <LoginHero isLandscapeShell={isLandscapeShell} />
          </LinearGradient>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.splitFormContent}
            style={styles.splitFormPane}
          >
            <View
              style={[
                styles.card,
                styles.cardSplit,
                { backgroundColor: colors.cardBackground, ...shadows.lg },
              ]}
            >
              <LoginForm />
            </View>
            {t().login.hint ? (
              <ThemedText variant="caption" muted style={styles.hint}>
                {t().login.hint}
              </ThemedText>
            ) : null}
          </ScrollView>
        </View>
      </KeyboardAvoider>
    );
  }

  return (
    <KeyboardAvoider style={styles.flex}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
        style={{ backgroundColor: colors.background }}
      >
        <LinearGradient
          colors={[colors.primaryGradientStart, colors.primaryGradientEnd]}
          start={{ x: ValueConstants.zero, y: ValueConstants.zero }}
          end={{ x: ValueConstants.one, y: ValueConstants.one }}
          style={styles.gradient}
        />

        <LoginHero isLandscapeShell={isLandscapeShell} />

        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardBackground, ...shadows.lg },
          ]}
        >
          <LoginForm />
        </View>

        {t().login.hint ? (
          <ThemedText variant="caption" muted style={styles.hint}>
            {t().login.hint}
          </ThemedText>
        ) : null}
      </ScrollView>
    </KeyboardAvoider>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: ValueConstants.one,
  },
  scrollContent: {
    flexGrow: 1,
  },
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
    borderRadius: radii.xxl,
    padding: spacing.xl,
    marginHorizontal: spacing.lg,
    marginTop: '10%',
  },
  hint: {
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  splitRoot: {
    flex: ValueConstants.one,
    flexDirection: 'row',
  },
  splitHero: {
    flex: ValueConstants.one,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  splitFormPane: {
    flex: ValueConstants.one,
  },
  splitFormContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xxl,
  },
  cardSplit: {
    width: '100%',
    maxWidth: AUTH_CARD_MAX_WIDTH,
    marginHorizontal: ValueConstants.zero,
    marginTop: ValueConstants.zero,
  },
});

export default LoginScreen;
