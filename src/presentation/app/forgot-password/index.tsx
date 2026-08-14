import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { KeyboardAvoider } from '@presentation/base/widgets/layout/keyboard-avoider';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStores } from '@presentation/bootstrap/use-stores';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { ForgotPasswordInputView } from '@presentation/app/forgot-password/body/forgot-password-input-view';
import { ForgotPasswordSuccessView } from '@presentation/app/forgot-password/body/forgot-password-success-view';
import { useLayout } from '@presentation/base/responsive/use-layout';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { shadows } from '@presentation/base/theme/tokens/effects/shadows';
import { spacing, radii, fontWeights, iconSizes, controlSizes, avatarSizes, mediaSizes, decorSizes, layoutSizes, zIndices, opacities } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { CharConstants, ValueConstants } from '@core/constants';
import { OrientationType } from '@presentation/base/responsive/orientation-type';

const AUTH_CARD_MAX_WIDTH = layoutSizes.maxContentXl;

export const ForgotPasswordScreen = (): React.JSX.Element => {
  const router = useRouter();
  const colors = useTheme().colors;
  const { isExpanded, orientation } = useLayout();
  const isLandscapeShell = isExpanded && orientation === OrientationType.Landscape;

  const { authStore } = useStores();
  const requestPasswordReset = authStore((s) => s.requestPasswordReset);

  const [email, setEmail] = useState(CharConstants.empty);
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendError, setSendError] = useState<string | undefined>(undefined);

  const handleSend = async (): Promise<void> => {
    if (email.trim().length === ValueConstants.zero) return;
    setSendError(undefined);
    setLoading(true);
    const failure = await requestPasswordReset(email.trim());
    setLoading(false);
    if (failure === null) {
      setSent(true);
    } else {
      setSendError(t().forgotPassword.sendError);
    }
  };

  const hero = (
    <View style={[styles.gradientCenter, isLandscapeShell ? styles.heroLandscape : null]}>
      <View style={[styles.iconBadge, { backgroundColor: colors.gradientSurface }]}>
        <Ionicons name="key-outline" size={isLandscapeShell ? iconSizes.xxxl : iconSizes.xxl} color={colors.onOverlay} />
      </View>
      <ThemedText variant="subtitle" style={[styles.heroTitle, { color: colors.onOverlay }]}>
        {t().forgotPassword.title}
      </ThemedText>
      <View style={styles.heroSubtitleWrap}>
        <ThemedText variant="body" style={[styles.heroSubtitle, { color: colors.onOverlay }]}>
          {t().forgotPassword.subtitle}
        </ThemedText>
      </View>
    </View>
  );

  const cardBody = sent ? (
    <ForgotPasswordSuccessView
      email={email}
      onBack={() => router.back()}
      onTryDifferent={() => setSent(false)}
    />
  ) : (
    <ForgotPasswordInputView
      email={email}
      onChangeEmail={setEmail}
      focused={focused}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      loading={loading}
      onSend={() => { void handleSend(); }}
      onBack={() => router.back()}
      error={sendError}
    />
  );

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
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: colors.gradientSurface }]}
          accessibilityRole="button"
          accessibilityLabel={t().forgotPassword.backToLogin}
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

export default ForgotPasswordScreen;
