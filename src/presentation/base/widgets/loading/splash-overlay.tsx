import { useCallback, useEffect, useState } from 'react';
import { isWeb } from '@infrastructure/constants/platform';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { RecipelyLogo } from '@presentation/base/widgets/brand/recipely-logo';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { shadows } from '@presentation/base/theme/tokens/effects/shadows';
import { spacing, fontSizes, fontWeights, letterSpacings, zIndices, opacities, BrandColors, radii } from '@presentation/base/theme';
import { useTranslations } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

const VISIBLE_MS = 1400;
const FADE_MS = 400;
/** How many fade-lengths to wait for the fade's callback before removing the splash anyway. */
const FALLBACK_FADE_FACTOR = 3;
const TILE_SIZE = 128;
const LOGO_SIZE = 96;

/**
 * Auto-dismissing brand splash shown on app boot. Displays the Recipely logo
 * inside a white tile on the primary gradient, with the localised tagline.
 * Tap anywhere to skip; auto-fades after `VISIBLE_MS`.
 *
 * @remarks
 * - **Never on the web.** A site does not open on a splash, and the static
 *   export rendered this one into every page's HTML: it stayed up until the
 *   7 MB bundle had loaded and hydrated, and forever when that bundle was
 *   missing after a deploy.
 * - **It lets go of touches the moment it starts to leave.** It used to unmount
 *   only when the fade reported `finished`, and stay a full-screen, touch-taking
 *   button until then. On iOS the fade could be interrupted at start-up, leaving
 *   it mounted at opacity 0: the welcome tour looked frozen — "Sign in",
 *   "Create account" and "Skip" did nothing — until a tap happened to dismiss
 *   the invisible splash. Now touches pass through from the first frame of the
 *   fade, and it unmounts when the fade ends however it ends, or after a
 *   fallback delay if the animation never reports back.
 */
export const SplashOverlay = (): React.JSX.Element | null => {
  const t = useTranslations();
  const colors = useTheme().colors;
  const [isVisible, setVisible] = useState(!isWeb());
  const [isLeaving, setLeaving] = useState(false);
  const [opacity] = useState(() => new Animated.Value(ValueConstants.one));

  const dismiss = useCallback((): void => {
    setLeaving(true);
    Animated.timing(opacity, {
      toValue: ValueConstants.zero,
      duration: FADE_MS,
      easing: Easing.out(Easing.quad),
      useNativeDriver: !isWeb(),
    }).start(() => setVisible(false));
  }, [opacity]);

  useEffect(() => {
    const id = setTimeout(dismiss, VISIBLE_MS);
    // Gone even if the fade never reports back.
    const fallback = setTimeout(() => setVisible(false), VISIBLE_MS + FADE_MS * FALLBACK_FADE_FACTOR);
    return () => {
      clearTimeout(id);
      clearTimeout(fallback);
    };
  }, [dismiss]);

  if (!isVisible) return null;

  return (
    <Animated.View
      style={[styles.root, { opacity }]}
      pointerEvents={isLeaving ? 'none' : 'auto'}
    >
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={dismiss}
        accessibilityRole="button"
        accessibilityLabel={t.splash.dismiss}
      >
        <LinearGradient
          colors={[colors.primaryGradientStart, colors.primaryGradientEnd]}
          start={{ x: ValueConstants.zero, y: ValueConstants.zero }}
          end={{ x: ValueConstants.one, y: ValueConstants.one }}
          style={styles.fill}
        >
          <View style={styles.center}>
            <View style={[styles.tile, shadows.lg]}>
              <RecipelyLogo size={LOGO_SIZE} />
            </View>
            <ThemedText
              variant="headline"
              style={[styles.wordmark, { color: colors.onOverlay }]}
            >
              Recipely
            </ThemedText>
            <ThemedText
              variant="caption"
              style={[styles.tagline, { color: colors.onOverlay }]}
            >
              {t.splash.tagline}
            </ThemedText>
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    zIndex: zIndices.splash,
  },
  fill: {
    flex: ValueConstants.one,
  },
  center: {
    flex: ValueConstants.one,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderRadius: radii.xxxl,
    backgroundColor: BrandColors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmark: {
    fontSize: fontSizes.headline,
    fontWeight: fontWeights.heavy,
    letterSpacing: letterSpacings.tighter,
    marginTop: spacing.xs,
  },
  tagline: {
    opacity: opacities.pressedFaint,
    letterSpacing: letterSpacings.subtle,
  },
});
