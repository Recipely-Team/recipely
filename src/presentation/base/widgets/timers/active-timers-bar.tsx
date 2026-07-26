import { ScrollView, StyleSheet, View } from 'react-native';
import { usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { TimerChip } from '@presentation/base/widgets/timers/timer-chip';
import { timerStore } from '@application/timers/timer-store';
import { spacing, radii, controlSizes, decorSizes, borderWidths, zIndices, opacities } from '@presentation/base/theme';
import { shadows } from '@presentation/base/theme/tokens/effects/shadows';
import { ValueConstants } from '@core/constants';

/**
 * Matches the single-recipe detail route (`/recipes/:recipeId`) so this bar
 * can tell whether a timer belongs to the recipe currently on screen — see
 * {@link ActiveTimersBar}.
 */
const RECIPE_DETAIL_PATH = /^\/recipes\/([^/]+)$/;

/**
 * Floating bar showing every active timer that isn't already visible inline
 * on the current screen — tap a chip to open its recipe.
 *
 * Mounted once at the root so a timer keeps surfacing (and stays
 * controllable) while the user navigates away from the recipe that started
 * it, and so multiple simultaneous timers (prep + cook on one recipe, or
 * timers across several recipes/instruction steps) are all reachable from
 * one place. The one case it deliberately hides is a timer for the recipe
 * whose detail screen is currently open: that timer already has a live
 * inline countdown (the prep/cook stat segment, or the step's inline chip),
 * so repeating it here would be a literal on-screen duplicate.
 */
export const ActiveTimersBar = (): React.JSX.Element | null => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const timers = timerStore((s) => s.timers);
  const currentRecipeId = RECIPE_DETAIL_PATH.exec(pathname)?.[1] ?? null;
  const entries = Object.values(timers).filter(
    (entry) => entry.recipeId !== currentRecipeId,
  );

  if (entries.length === ValueConstants.zero) return null;

  return (
    <View
      pointerEvents="box-none"
      style={[styles.bar, { bottom: insets.bottom + controlSizes.tabBar + spacing.sm }]}
    >
      <View
        style={[
          styles.barInner,
          { backgroundColor: colors.surface, borderColor: colors.border },
          shadows.md as object,
        ]}
      >
        <View style={[styles.barHandle, { backgroundColor: colors.border }]} />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
          keyboardShouldPersistTaps="handled"
        >
          {entries.map((entry) => (
            <TimerChip key={entry.id} entry={entry} />
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    zIndex: zIndices.timersBar,
  },
  barInner: {
    borderRadius: radii.xl,
    borderWidth: borderWidths.hairline,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  barHandle: {
    width: decorSizes.dragHandleWidth,
    height: controlSizes.progressBarThin,
    borderRadius: radii.round,
    alignSelf: 'center',
    marginBottom: spacing.xs,
    opacity: opacities.inactive,
  },
  chipRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
});
