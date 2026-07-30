import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { KeyboardAvoider } from '@presentation/base/widgets/layout/keyboard-avoider';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStores } from '@presentation/bootstrap/use-stores';
import { RegisterHero } from '@presentation/app/register/body/register-hero';
import { RegisterForm } from '@presentation/app/register/body/register-form';
import { useLayout } from '@presentation/base/responsive/use-layout';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { shadows } from '@presentation/base/theme/tokens/effects/shadows';
import { spacing, radii, iconSizes, controlSizes, decorSizes, layoutSizes, borderWidths, zIndices } from '@presentation/base/theme';
import { ValueConstants } from '@core/constants';
import { RoutePaths } from '@presentation/base/constants';
import { enterApp } from '@presentation/navigation/enter-app';
import { OrientationType } from '@presentation/base/responsive/orientation-type';

const AUTH_CARD_MAX_WIDTH = layoutSizes.authCardMaxWidth;

export const RegisterScreen = (): React.JSX.Element => {
  const router = useRouter();
  const colors = useTheme().colors;
  const { isWebShell, orientation } = useLayout();
  const isLandscapeShell = isWebShell && orientation === OrientationType.Landscape;

  const { authStore } = useStores();
  const state = authStore((s) => s.state);

  useEffect(() => {
    if (state.status === 'authenticated') {
    // Registration is a one-way door: the account exists now, so the form
      // that created it — and the login screen it was reached from — must not
      // stay behind a back gesture.
      enterApp(router, RoutePaths.recipes);
    }
  }, [state.status, router]);

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
            <RegisterHero isLandscapeShell={isLandscapeShell} />
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
              <RegisterForm />
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
          accessibilityRole="button"
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: colors.gradientSurface, borderColor: colors.gradientBorder }]}
        >
          <Ionicons name="chevron-back" size={iconSizes.xl} color={colors.onOverlay} />
        </Pressable>

        <RegisterHero isLandscapeShell={isLandscapeShell} />

        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardBackground, ...shadows.lg },
          ]}
        >
          <RegisterForm />
        </View>
      </ScrollView>
    </KeyboardAvoider>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: ValueConstants.one,
  },
  scrollContent: {
    flexGrow: ValueConstants.one,
  },
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
    borderRadius: radii.xxl,
    padding: spacing.xl,
    marginHorizontal: spacing.lg,
    marginTop: -decorSizes.cardOverlap,
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
  },
});

export default RegisterScreen;
