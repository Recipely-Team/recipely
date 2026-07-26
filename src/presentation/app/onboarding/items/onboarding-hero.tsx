import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { shadows } from '@presentation/base/theme/tokens/effects/shadows';
import { radii, opacities } from '@presentation/base/theme';
import { HeroRecipes } from '@presentation/app/onboarding/items/hero-recipes';
import { HeroAI } from '@presentation/app/onboarding/items/hero-ai';
import { HeroTimer } from '@presentation/app/onboarding/items/hero-timer';
import type { OnboardingSlideKind } from '@presentation/app/onboarding/model/onboarding-slide-kind';
import { ValueConstants } from '@core/constants';

const BLOB_LARGE = 300;
const BLOB_SMALL = 260;
const HERO_WEB_SCALE = 1.18;
// The blobs are bled off the panel edges so only their inner curve shows;
// each offset is a fraction of its own blob, not an arbitrary nudge.
const BLOB_TOP_BLEED = -80;
const BLOB_RIGHT_BLEED = -60;
const BLOB_BOTTOM_BLEED = -90;
const BLOB_LEFT_BLEED = -50;

export interface OnboardingHeroProps {
  kind: OnboardingSlideKind;
  /** Enlarge the floating content for the roomier web hero panel. */
  web?: boolean;
  /** Whether the slide is in view — drives the staggered entrance replay. */
  active?: boolean;
  style?: StyleProp<ViewStyle>;
}

const HeroContent = ({ kind, active }: { kind: OnboardingSlideKind; active: boolean }): React.JSX.Element => {
  if (kind === 'recipes') return <HeroRecipes active={active} />;
  if (kind === 'ai') return <HeroAI active={active} />;
  return <HeroTimer active={active} />;
};

/**
 * The gradient hero panel behind a welcome slide: the brand gradient, two soft
 * ambient blobs, and the per-slide floating illustration centered on top.
 */
export const OnboardingHero = ({ kind, web = false, active = true, style }: OnboardingHeroProps): React.JSX.Element => {
  const colors = useTheme().colors;
  return (
    <LinearGradient
      colors={[colors.primaryGradientStart, colors.primaryGradientEnd]}
      start={{ x: ValueConstants.zero, y: ValueConstants.zero }}
      end={{ x: ValueConstants.one, y: ValueConstants.one }}
      style={[styles.panel, shadows.lg, style]}
    >
      <View
        style={[
          styles.blob,
          styles.blobTop,
          { backgroundColor: colors.onOverlay, opacity: opacities.scrim },
        ]}
      />
      <View
        style={[
          styles.blob,
          styles.blobBottom,
          { backgroundColor: colors.onOverlay, opacity: opacities.scrimSubtle },
        ]}
      />
      <View style={web ? styles.contentWeb : styles.content}>
        <HeroContent kind={kind} active={active} />
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  panel: {
    flex: ValueConstants.one,
    borderRadius: radii.xxxl,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  blob: {
    position: 'absolute',
    borderRadius: BLOB_LARGE,
  },
  blobTop: {
    top: BLOB_TOP_BLEED,
    right: BLOB_RIGHT_BLEED,
    width: BLOB_LARGE,
    height: BLOB_LARGE,
  },
  blobBottom: {
    bottom: BLOB_BOTTOM_BLEED,
    left: BLOB_LEFT_BLEED,
    width: BLOB_SMALL,
    height: BLOB_SMALL,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentWeb: {
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ scale: HERO_WEB_SCALE }],
  },
});
