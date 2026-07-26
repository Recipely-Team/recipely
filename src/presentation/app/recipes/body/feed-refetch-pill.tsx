import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, layoutSizes, zIndices, shadows } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

/**
 * Floating "Refreshing…" pill for the mobile feed.
 *
 * A filter/sort/search change refetches in place and deliberately keeps the
 * previous rows on screen (see `recipe-list-state`), which without a signal
 * makes a cuisine tap look like nothing happened — or worse, like the app
 * filtered locally and found the same thing. This is that signal.
 *
 * Positioned rather than laid out in flow so it cannot reflow the list mid-
 * refetch (the rows must not shift under the finger that just tapped), and
 * `pointerEvents="none"` so it never swallows a tap on the chip behind it.
 *
 * `top` has to clear the collapsing header band, which floats opaquely over the
 * same space. It adds `insets.top` for the same reason the band itself does: RN
 * measures an absolutely-positioned child's `top` from the parent's own edge,
 * ignoring that parent's SafeAreaView padding — so a bare `homeHeaderMax` would
 * tuck the pill up under the band by exactly the notch height.
 */
export const FeedRefetchPill = (): React.JSX.Element => {
  const colors = useTheme().colors;
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[styles.anchor, { top: insets.top + layoutSizes.homeHeaderMax + spacing.sm }]}
      pointerEvents="none"
    >
      <View style={[styles.pill, { backgroundColor: colors.surface }, shadows.md]}>
        <ActivityIndicator size="small" color={colors.primary} />
        <ThemedText variant="caption" muted>
          {t().recipes.refreshing}
        </ThemedText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  anchor: {
    // `top` is applied inline from the safe-area inset (see the component body).
    position: 'absolute',
    left: ValueConstants.zero,
    right: ValueConstants.zero,
    alignItems: 'center',
    zIndex: zIndices.stickyHeader,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.round,
  },
});
