import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { useLayout } from '@presentation/base/responsive/use-layout';
import { useTabBarState } from '@presentation/navigation/use-tab-bar-state';
import { TimerChip } from '@presentation/base/widgets/timers/timer-chip';
import { timerStore } from '@application/timers/timer-store';
import { timersBarStore } from '@presentation/base/timers/timers-bar-store';
import { spacing, radii, fontWeights, iconSizes, controlSizes, borderWidths, zIndices, maxFontScales } from '@presentation/base/theme';
import { shadows } from '@presentation/base/theme/tokens/effects/shadows';
import { t } from '@presentation/i18n';
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
 *
 * Being pinned over the content, it can cover whatever sits at the bottom of
 * the screen — the onboarding CTAs are directly underneath it, with no way to
 * scroll them clear. So it collapses to a small corner pill: the timer stays
 * visible and controllable (never silently lose a running countdown), but it
 * stops blocking anything. The control for that is a round chevron button at
 * the end of the chip row: the hairline grabber it replaced read as decoration
 * (testers reported the bar as unhideable), and the labelled caption row that
 * replaced the grabber cost the bar a whole second row of chrome.
 * Collapsed state lives in `timersBarStore` rather than the timer store
 * because it is a view preference, not timer state, and it is persisted so a
 * bar parked to reach the content underneath stays parked across launches.
 */
export const ActiveTimersBar = (): React.JSX.Element | null => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const { isWebShell } = useLayout();
  // The bar sits above the tab bar where there is one. On routes without it
  // (onboarding, auth, detail pages) reserving that height pushed the bar UP
  // into the content instead of leaving it at the screen edge.
  const hasTabBar = useTabBarState() !== null && !isWebShell;
  const timers = timerStore((s) => s.timers);
  const collapsed = timersBarStore((s) => s.collapsed);
  const setCollapsed = timersBarStore((s) => s.setCollapsed);
  const currentRecipeId = RECIPE_DETAIL_PATH.exec(pathname)?.[1] ?? null;
  const entries = Object.values(timers).filter(
    (entry) => entry.recipeId !== currentRecipeId,
  );

  if (entries.length === ValueConstants.zero) return null;

  const bottom =
    insets.bottom + (hasTabBar ? controlSizes.tabBar : ValueConstants.zero) + spacing.sm;

  if (collapsed) {
    return (
      <View pointerEvents="box-none" style={[styles.bar, { bottom }]}>
        <Pressable
          onPress={() => void setCollapsed(false)}
          accessibilityRole="button"
          accessibilityLabel={t().timer.expand}
          hitSlop={spacing.sm}
          style={[
            styles.collapsedPill,
            { backgroundColor: colors.surface, borderColor: colors.border },
            shadows.md as object,
          ]}
        >
          <Ionicons name="timer-outline" size={iconSizes.xl} color={colors.primary} />
          <ThemedText
            variant="subtitle"
            maxFontSizeMultiplier={maxFontScales.badge}
            style={[styles.collapsedCount, { color: colors.primary }]}
          >
            {entries.length}
          </ThemedText>
        </Pressable>
      </View>
    );
  }

  return (
    <View pointerEvents="box-none" style={[styles.bar, { bottom }]}>
      <View
        style={[
          styles.barInner,
          { backgroundColor: colors.surface, borderColor: colors.border },
          shadows.md as object,
        ]}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipScroll}
          contentContainerStyle={styles.chipRow}
          keyboardShouldPersistTaps="handled"
        >
          {entries.map((entry) => (
            <TimerChip key={entry.id} entry={entry} />
          ))}
        </ScrollView>
        <Pressable
          onPress={() => void setCollapsed(true)}
          accessibilityRole="button"
          accessibilityLabel={t().timer.collapse}
          hitSlop={spacing.sm}
          style={[styles.hideBtn, { backgroundColor: colors.chipBackground }]}
        >
          <Ionicons name="chevron-down" size={iconSizes.xl} color={colors.textMuted} />
        </Pressable>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radii.xl,
    borderWidth: borderWidths.hairline,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  chipScroll: {
    flex: ValueConstants.one,
  },
  // A round button parked at the end of the row: it reads as a control the way
  // the hairline grabber before it never did, without the uppercase caption
  // that replaced the grabber and cluttered the bar with a second row. Sized as
  // a shape (it holds a glyph, never text) and slopped out well past the 44pt
  // minimum, because this is the control that gets the bar off the content.
  hideBtn: {
    width: controlSizes.floatingBtn,
    height: controlSizes.floatingBtn,
    borderRadius: radii.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Right-aligned so the collapsed pill parks in the corner and leaves the
  // widest possible span of whatever is underneath reachable. Its resting size
  // is a full 44pt tall: collapsed is a state the bar can sit in for the whole
  // cook, so the way back out cannot be a target you have to aim at.
  collapsedPill: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: controlSizes.searchBar,
    paddingHorizontal: spacing.md,
    borderRadius: radii.round,
    borderWidth: borderWidths.hairline,
  },
  collapsedCount: {
    fontWeight: fontWeights.bold,
  },
  chipRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
});
