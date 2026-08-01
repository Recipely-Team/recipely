import { useCallback, useRef, useState } from 'react';
import { isString } from '@core/guards/type-guards';
import { AuthField } from '@presentation/app/login/model/auth-field';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { KeyboardAvoider } from '@presentation/base/widgets/layout/keyboard-avoider';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useStores } from '@presentation/bootstrap/use-stores';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { authFormMessage } from '@presentation/base/errors/auth-form-message';
import { ResetPasswordFormView } from '@presentation/app/reset-password/body/reset-password-form-view';
import { ResetPasswordSuccessView } from '@presentation/app/reset-password/body/reset-password-success-view';
import { ResetPasswordInvalidLinkView } from '@presentation/app/reset-password/body/reset-password-invalid-link-view';
import { useLayout } from '@presentation/base/responsive/use-layout';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { shadows } from '@presentation/base/theme/tokens/effects/shadows';
import { spacing, radii, fontWeights, iconSizes, controlSizes, avatarSizes, mediaSizes, decorSizes, layoutSizes, zIndices, opacities } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { CharConstants, ValueConstants } from '@core/constants';
import { RoutePaths } from '@presentation/base/constants';
import { OrientationType } from '@presentation/base/responsive/orientation-type';

const AUTH_CARD_MAX_WIDTH = layoutSizes.maxContentXl;
const MIN_PASSWORD_LENGTH = 8;

export const ResetPasswordScreen = (): React.JSX.Element => {
  const router = useRouter();
  const colors = useTheme().colors;
  const { isWebShell, orientation } = useLayout();
  const isLandscapeShell = isWebShell && orientation === OrientationType.Landscape;

  const { token } = useLocalSearchParams<{ token?: string }>();
  const tokenValue = isString(token) ? token.trim() : CharConstants.empty;

  const { authStore } = useStores();
  const resetPassword = authStore((s) => s.resetPassword);

  const [newPassword, setNewPassword] = useState(CharConstants.empty);
  const [confirmPassword, setConfirmPassword] = useState(CharConstants.empty);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [focusField, setFocusField] = useState<AuthField | null>(null);
  const [loading, setLoading] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const confirmRef = useRef<TextInput>(null);

  const handleSubmit = useCallback(async (): Promise<void> => {
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setError(t().resetPassword.tooShort);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t().resetPassword.mismatch);
      return;
    }
    setError(undefined);
    setLoading(true);
    const failure = await resetPassword(tokenValue, newPassword);
    setLoading(false);
    if (failure === null) {
      setSucceeded(true);
    } else {
      setError(
        authFormMessage(failure, {
          not_found: t().resetPassword.invalidOrExpired,
          validation: t().resetPassword.invalidOrExpired,
        }),
      );
    }
  }, [newPassword, confirmPassword, resetPassword, tokenValue]);

  const hero = (
    <View style={[styles.gradientCenter, isLandscapeShell ? styles.heroLandscape : null]}>
      <View style={[styles.iconBadge, { backgroundColor: colors.gradientSurface }]}>
        <Ionicons
          name="lock-closed-outline"
          size={isLandscapeShell ? iconSizes.xxxl : iconSizes.xxl}
          color={colors.onOverlay}
        />
      </View>
      <ThemedText variant="subtitle" style={[styles.heroTitle, { color: colors.onOverlay }]}>
        {t().resetPassword.title}
      </ThemedText>
      <View style={styles.heroSubtitleWrap}>
        <ThemedText variant="body" style={[styles.heroSubtitle, { color: colors.onOverlay }]}>
          {t().resetPassword.subtitle}
        </ThemedText>
      </View>
    </View>
  );

  let cardBody: React.JSX.Element;

  if (tokenValue.length === ValueConstants.zero) {
    cardBody = (
      <ResetPasswordInvalidLinkView onBack={() => router.replace(RoutePaths.login)} />
    );
  } else if (succeeded) {
    cardBody = (
      <ResetPasswordSuccessView onBack={() => router.replace(RoutePaths.login)} />
    );
  } else {
    cardBody = (
      <ResetPasswordFormView
        newPassword={newPassword}
        onChangeNew={setNewPassword}
        confirmPassword={confirmPassword}
        onChangeConfirm={setConfirmPassword}
        showNew={showNew}
        onToggleNew={() => setShowNew((v) => !v)}
        showConfirm={showConfirm}
        onToggleConfirm={() => setShowConfirm((v) => !v)}
        focusField={focusField}
        onFocus={setFocusField}
        onBlur={() => setFocusField(null)}
        confirmRef={confirmRef}
        loading={loading}
        error={error}
        onSubmit={() => { void handleSubmit(); }}
        onBack={() => router.replace(RoutePaths.login)}
      />
    );
  }

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
            {hero}
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
              {cardBody}
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
          onPress={() => router.replace(RoutePaths.login)}
          style={[styles.backBtn, { backgroundColor: colors.gradientSurface }]}
          accessibilityRole="button"
          accessibilityLabel={t().resetPassword.backToLogin}
        >
          <Ionicons name="chevron-back" size={iconSizes.xl} color={colors.onOverlay} />
        </Pressable>

        {hero}

        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardBackground },
            shadows.lg,
          ]}
        >
          {cardBody}
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
    borderRadius: controlSizes.iconBtn / ValueConstants.two,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: zIndices.raised,
  },
  gradientCenter: {
    height: mediaSizes.heroImageHeight,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  iconBadge: {
    width: avatarSizes.lg,
    height: avatarSizes.lg,
    borderRadius: radii.xxl2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  heroTitle: {
    fontWeight: fontWeights.bold,
    textAlign: 'center',
  },
  heroSubtitleWrap: {
    opacity: opacities.onMedia,
  },
  heroSubtitle: {
    textAlign: 'center',
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
  heroLandscape: {
    height: 'auto',
    maxWidth: layoutSizes.maxContentLg,
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

export default ResetPasswordScreen;
