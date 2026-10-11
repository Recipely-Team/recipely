import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { type AnimatedStyle } from 'react-native-reanimated';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { controlSizes, spacing } from '@presentation/base/theme';
import { ValueConstants } from '@core/constants';

export interface TabAppBarProps {
  title: string;
  /** Drawn before the title on the same line — the Recipes logo. */
  leading?: ReactNode;
  /** {@link TabAppBarButton}s, right-aligned, 8 apart; at most four (Diary: calendar, goals, cart, bell). The cart and the bell end every tab's row. */
  actions?: ReactNode;
  /** Animates the title in place — the Recipes band's scroll-driven shrink. */
  titleStyle?: StyleProp<AnimatedStyle<StyleProp<ViewStyle>>>;
}

/**
 * The one top bar of the five bottom-tab roots on the native shell: 56 tall,
 * a 24/700 title left, round buttons right (design spec → Tab app bar).
 *
 * @remarks
 * - **Same row on every tab.** Height, padding and title style never change,
 *   so switching tabs leaves the title where it was; only the actions differ.
 * - **No safe-area inset here**: each screen already starts below the status
 *   bar, and the Recipes band positions itself absolutely.
 */
export const TabAppBar = ({ title, leading, actions, titleStyle }: TabAppBarProps): React.JSX.Element => (
  <View style={styles.root}>
    <View style={styles.titles}>
      {leading}
      <Animated.View style={[styles.titleAnchor, titleStyle]}>
        <ThemedText variant="title" accessibilityRole="header" numberOfLines={ValueConstants.one}>
          {title}
        </ThemedText>
      </Animated.View>
    </View>
    {actions === undefined ? null : <View style={styles.actions}>{actions}</View>}
  </View>
);

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: controlSizes.floatingBtn + spacing.sm * ValueConstants.two,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  titles: {
    flex: ValueConstants.one,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  titleAnchor: {
    flexShrink: ValueConstants.one,
    transformOrigin: 'left',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
