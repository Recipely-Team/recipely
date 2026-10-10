import { useEffect } from 'react';
import { isString } from '@core/guards/type-guards';
import { StoreStatus } from '@application/store/store-status';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { KeyboardAvoider } from '@presentation/base/widgets/layout/keyboard-avoider';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { resolveRedirect } from '@presentation/navigation/resolve-redirect';
import { useGoBackOrHome } from '@presentation/base/hooks/navigation/use-go-back-or-home';
import { useStores } from '@presentation/bootstrap/use-stores';
import { VerifyHero } from '@presentation/app/verify-code/body/verify-hero';
import { VerifyCodeCard } from '@presentation/app/verify-code/body/verify-code-card';
import { useTwoPaneSplit } from '@presentation/base/responsive/fold/use-two-pane-split';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { shadows } from '@presentation/base/theme/tokens/effects/shadows';
import { spacing, radii, iconSizes, controlSizes, mediaSizes, decorSizes, layoutSizes, zIndices } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { CharConstants, ValueConstants } from '@core/constants';
import { RoutePaths } from '@presentation/base/constants';
import { enterApp } from '@presentation/navigation/enter-app';

const AUTH_CARD_MAX_WIDTH = layoutSizes.authCardMaxWidth;

export const VerifyCodeScreen = (): React.JSX.Element => {
  const router = useRouter();
  const goBack = useGoBackOrHome(RoutePaths.login);
  const colors = useTheme().colors;
  const split = useTwoPaneSplit();
  const isLandscapeShell = split.isSplit;

  const params = useLocalSearchParams<{ email?: string; expiresAt?: string; redirect?: string }>();
  const email = isString(params.email) ? params.email : CharConstants.empty;
  const initialExpiresAt = isString(params.expiresAt) ? params.expiresAt : CharConstants.empty;

  const { authStore } = useStores();
  const state = authStore((s) => s.state);

  useEffect(() => {
    if (state.status === StoreStatus.Authenticated) {
    // The sign-up detour is spent: replace the stack.
      enterApp(router, resolveRedirect(params.redirect) as Href);
    }
  }, [state.status, router, params.redirect]);

  if (isLandscapeShell) {
    return (
      <KeyboardAvoider style={styles.flex}>
        <View style={[styles.splitRoot, split.rowStyle, { backgroundColor: colors.background }]}>
          <LinearGradient
            colors={[colors.primaryGradientStart, colors.primaryGradientEnd]}
            start={{ x: ValueConstants.zero, y: ValueConstants.zero }}
            end={{ x: ValueConstants.one, y: ValueConstants.one }}
            style={[styles.splitHero, split.firstPaneStyle]}
          >
            <VerifyHero isLandscapeShell={isLandscapeShell} email={email} />
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
                { backgroundColor: colors.cardBackground },
                shadows.lg,
              ]}
            >
              <VerifyCodeCard email={email} initialExpiresAt={initialExpiresAt} />
            </View>
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

        <Pressable
          onPress={goBack}
          style={[styles.backBtn, { backgroundColor: colors.gradientSurface }]}
          accessibilityRole="button"
          accessibilityLabel={t().verify.changeEmail}
        >
          <Ionicons name="chevron-back" size={iconSizes.xl} color={colors.onOverlay} />
        </Pressable>

        <VerifyHero isLandscapeShell={isLandscapeShell} email={email} />

        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardBackground },
            shadows.lg,
          ]}
        >
          <VerifyCodeCard email={email} initialExpiresAt={initialExpiresAt} />
        </View>
      </ScrollView>
    </KeyboardAvoider>
  );
};

const styles = StyleSheet.create({
  flex: { flex: ValueConstants.one },
  scrollContent: { flexGrow: ValueConstants.one },
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
    borderRadius: radii.xxl,
    padding: spacing.xl,
    marginHorizontal: spacing.lg,
    marginTop: -decorSizes.cardOverlap,
    marginBottom: spacing.xxl,
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
    flexGrow: ValueConstants.one,
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
    marginBottom: ValueConstants.zero,
  },
});

export default VerifyCodeScreen;
