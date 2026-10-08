import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ValueConstants } from '@core/constants';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { avatarSizes, borderWidths, radii, spacing } from '@presentation/base/theme';
import { ChefsSoonMetrics as M } from '@presentation/app/creators/model/chefs-soon-metrics';

const GHOSTS = ['a', 'b', 'c', 'd'] as const;
const FADE_START = { x: 0, y: M.ghostFadeFrom };
const FADE_END = { x: 0, y: 1 };

/**
 * Four empty creator cards in the real card's shape, 2 × 2, faded into the
 * background — a hint of the grid the Chefs tab will become. Decorative only.
 */
export const GhostCreatorGrid = (): React.JSX.Element => {
  const colors = useTheme().colors;
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={[styles.grid, { opacity: M.ghostOpacity }]}>
        {GHOSTS.map((key) => (
          <View key={key} style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
            <View style={[styles.avatar, { backgroundColor: colors.skeleton }]} />
            {M.ghostBarHeights.map((height, index) => (
              <View
                key={height + index}
                style={[{ height, width: M.ghostBarWidths[index], borderRadius: height / ValueConstants.two, backgroundColor: colors.skeleton }]}
              />
            ))}
          </View>
        ))}
      </View>
      <LinearGradient
        pointerEvents="none"
        colors={[colors.backgroundClear, colors.background]}
        start={FADE_START}
        end={FADE_END}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  card: {
    flexBasis: '45%',
    flexGrow: ValueConstants.one,
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radii.xl,
    borderWidth: borderWidths.hairline,
    paddingTop: spacing.lg2,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  avatar: {
    width: avatarSizes.creatorCard,
    height: avatarSizes.creatorCard,
    borderRadius: avatarSizes.creatorCard / ValueConstants.two,
    marginBottom: spacing.xs,
  },
});
