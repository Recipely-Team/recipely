import { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { BrandColors } from '@presentation/base/theme/colors/palette/brand-colors';
import { shadows } from '@presentation/base/theme/tokens/effects/shadows';
import { controlSizes, durations, iconSizes, radii, spacing } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

export interface PhotoArrowsProps {
  current: number;
  total: number;
  /** False while a pointer is away from the frame; the arrows fade out rather than vanish. */
  revealed: boolean;
  onStep: (delta: number) => void;
}

/**
 * Previous / next over the hero, for a mouse or a tablet that cannot swipe
 * comfortably. The first photo has no Previous and the last no Next — a
 * button that does nothing would be a question the screen answers by looking
 * broken.
 */
export const PhotoArrows = ({ current, total, revealed, onStep }: PhotoArrowsProps): React.JSX.Element => {
  const opacity = useSharedValue(revealed ? ValueConstants.one : ValueConstants.zero);

  useEffect(() => {
    opacity.value = withTiming(revealed ? ValueConstants.one : ValueConstants.zero, { duration: durations.hover });
  }, [revealed, opacity]);

  const fade = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const pointer = revealed ? 'auto' : 'none';

  return (
    <>
      {current > ValueConstants.zero ? (
        <Animated.View style={[styles.arrow, styles.left, fade]} pointerEvents={pointer}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t().recipes.previousPhoto}
            onPress={() => onStep(-ValueConstants.one)}
            style={[styles.button, shadows.md]}
          >
            <Ionicons name="chevron-back" size={iconSizes.xl} color={BrandColors.photoControlInk} />
          </Pressable>
        </Animated.View>
      ) : null}
      {current < total - ValueConstants.one ? (
        <Animated.View style={[styles.arrow, styles.right, fade]} pointerEvents={pointer}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t().recipes.nextPhoto}
            onPress={() => onStep(ValueConstants.one)}
            style={[styles.button, shadows.md]}
          >
            <Ionicons name="chevron-forward" size={iconSizes.xl} color={BrandColors.photoControlInk} />
          </Pressable>
        </Animated.View>
      ) : null}
    </>
  );
};

const styles = StyleSheet.create({
  arrow: {
    position: 'absolute',
    top: '50%',
    marginTop: -controlSizes.floatingBtn / ValueConstants.two,
  },
  left: { left: spacing.md },
  right: { right: spacing.md },
  // Pinned: circles, not text boxes.
  button: {
    width: controlSizes.floatingBtn,
    height: controlSizes.floatingBtn,
    borderRadius: radii.round,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BrandColors.photoControl,
  },
});
