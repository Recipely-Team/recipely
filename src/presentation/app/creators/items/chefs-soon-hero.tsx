import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ValueConstants } from '@core/constants';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { useReduceMotion } from '@presentation/base/hooks/accessibility/use-reduce-motion';
import { borderWidths, shadows } from '@presentation/base/theme';
import { ChefsSoonMetrics as M } from '@presentation/app/creators/model/chefs-soon-metrics';

type ChipSpot = (typeof M.chipSpots)[number];

const GRADIENT_START = { x: 0, y: 0 };
const GRADIENT_END = { x: 1, y: 1 };

/** One floating food chip; bobs up and back forever unless the device asks for less motion. */
const FloatingChip = ({ spot, still }: { spot: ChipSpot; still: boolean }): React.JSX.Element => {
  const colors = useTheme().colors;
  const lift = useSharedValue(ValueConstants.zero);
  useEffect(() => {
    if (still) return;
    lift.value = withDelay(
      spot.delay,
      withRepeat(withTiming(-M.bobDistance, { duration: M.bobMs / ValueConstants.two, easing: Easing.inOut(Easing.sin) }), -ValueConstants.one, true),
    );
  }, [lift, spot.delay, still]);
  const bob = useAnimatedStyle(() => ({ transform: [{ translateY: lift.value }] }));
  const { icon, delay: _delay, ...place } = spot;
  return (
    <Animated.View style={[styles.chip, shadows.sm, place, bob, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
      <Ionicons name={icon} size={M.chipGlyph} color={colors.primary} />
    </Animated.View>
  );
};

/**
 * The Chefs placeholder's illustration: a chef hat on a gradient disc inside two
 * soft primary halos, with four food chips floating around it. Decorative only.
 */
export const ChefsSoonHero = (): React.JSX.Element => {
  const colors = useTheme().colors;
  const still = useReduceMotion();
  return (
    <View style={styles.box} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={[styles.halo, styles.outer, { backgroundColor: colors.primaryHaloOuter }]}>
        <View style={[styles.halo, styles.inner, { backgroundColor: colors.primaryHaloInner }]}>
          <LinearGradient
            colors={[colors.primaryGradientStart, colors.primaryGradientEnd]}
            start={GRADIENT_START}
            end={GRADIENT_END}
            style={[styles.halo, styles.core, shadows.md]}
          >
            <MaterialCommunityIcons name="chef-hat" size={M.coreGlyph} color={colors.primaryText} />
          </LinearGradient>
        </View>
      </View>
      {M.chipSpots.map((spot) => (
        <FloatingChip key={spot.icon} spot={spot} still={still} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  box: {
    width: M.heroWidth,
    height: M.heroHeight,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  outer: { width: M.haloOuter, height: M.haloOuter, borderRadius: M.haloOuter / ValueConstants.two },
  inner: { width: M.haloInner, height: M.haloInner, borderRadius: M.haloInner / ValueConstants.two },
  core: { width: M.core, height: M.core, borderRadius: M.core / ValueConstants.two },
  chip: {
    position: 'absolute',
    width: M.chip,
    height: M.chip,
    borderRadius: M.chip / ValueConstants.two,
    borderWidth: borderWidths.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
