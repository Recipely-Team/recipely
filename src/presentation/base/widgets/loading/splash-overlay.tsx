import { useCallback, useEffect, useRef, useState } from 'react';
import { isWeb } from '@infrastructure/constants/platform';
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { RecipelyLogo } from '@presentation/base/widgets/brand/recipely-logo';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { shadows } from '@presentation/base/theme/tokens/effects/shadows';
import { spacing, fontSizes, fontWeights, letterSpacings, zIndices, opacities, BrandColors } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

const VISIBLE_MS = 1400;
const FADE_MS = 400;
const TILE_SIZE = 128;
const TILE_RADIUS = 32;
const LOGO_SIZE = 96;

/**
 * Auto-dismissing brand splash shown on app boot. Displays the Recipely logo
 * inside a white tile on the primary gradient, with the localised tagline.
 * Tap anywhere to skip; auto-fades after `VISIBLE_MS`.
 */
export const SplashOverlay = (): React.JSX.Element | null => {
  const colors = useTheme().colors;
  const [visible, setVisible] = useState(true);
  const opacity = useRef(new Animated.Value(1)).current;

  const dismiss = useCallback((): void => {
    Animated.timing(opacity, {
      toValue: ValueConstants.zero,
      duration: FADE_MS,
      easing: Easing.out(Easing.quad),
      useNativeDriver: !isWeb(),
    }).start(({ finished }) => {
      if (finished) setVisible(false);
    });
  }, [opacity]);

  useEffect(() => {
    const id = setTimeout(dismiss, VISIBLE_MS);
    return () => clearTimeout(id);
  }, [dismiss]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[styles.root, { opacity }]}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={dismiss}
        accessibilityRole="button"
        accessibilityLabel={t().splash.dismiss}
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
              {t().splash.tagline}
            </ThemedText>
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
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
    borderRadius: TILE_RADIUS,
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
