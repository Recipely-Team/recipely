import { StyleSheet, View, Pressable } from 'react-native';
import { UNREAD_BADGE_MAX, UNREAD_BADGE_OVERFLOW_LABEL } from '@presentation/base/constants/interaction-constants';
import Animated, {
  interpolate,
  Extrapolation,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { RecipelyLogo } from '@presentation/base/widgets/brand/recipely-logo';
import { SearchBar } from '@presentation/app/recipes/items/filters/search-bar';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, fontSizes, fontWeights, iconSizes, controlSizes, decorSizes, layoutSizes, borderWidths, zIndices, BrandColors } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

/** The title is half-way shrunk at the midpoint of the scroll, so the motion reads as continuous. */
const TITLE_SHRINK_MIDPOINT = 0.5;

export interface CollapsingHomeHeaderProps {
  /** Live vertical scroll offset of the recipe list, in px. */
  scrollY: SharedValue<number>;
  /**
   * Direction-aware band offset: 0 when shown, `hiddenHeaderOffset(insets.top)`
   * when hidden — the band's own height plus the inset it sits below, so it
   * leaves the screen instead of parking behind the status bar.
   */
  headerTranslateY: SharedValue<number>;
  /** When true, the band renders statically shown with no scroll-driven motion. */
  reduceMotion: boolean;
  onNotificationsPress: () => void;
  unreadCount: number;
  searchValue: string;
  onSearchChange: (text: string) => void;
}

/**
 * Mobile-only collapsing header band: the "Recipely" eyebrow, the large screen
 * title, the notifications bell, and the search field. Absolutely positioned over
 * the list; it slides up out of view on scroll-down and back on scroll-up
 * (`headerTranslateY`), while the title shrinks and the eyebrow fades as the list
 * scrolls past `layoutSizes.homeTitleShrink` (`scrollY`). With reduce-motion on it stays
 * fully shown at rest geometry.
 *
 * The band is absolutely positioned so it can float over the list and slide
 * independently of it — which also means it falls outside the parent
 * `SafeAreaView`'s flow and never receives its top padding (RN measures an
 * absolutely-positioned child's `top: 0` from the parent's own edge, ignoring
 * that parent's padding). It applies `useSafeAreaInsets().top` itself so the
 * eyebrow/title never render under the status bar / notch.
 */
export const CollapsingHomeHeader = ({
  scrollY,
  headerTranslateY,
  reduceMotion,
  onNotificationsPress,
  unreadCount,
  searchValue,
  onSearchChange,
}: CollapsingHomeHeaderProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const insets = useSafeAreaInsets();
  const badgeText = unreadCount > UNREAD_BADGE_MAX ? UNREAD_BADGE_OVERFLOW_LABEL : String(unreadCount);

  const bandStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: reduceMotion ? ValueConstants.zero : headerTranslateY.value }],
  }));

  const titleStyle = useAnimatedStyle(() => {
    const scale = reduceMotion
      ? 1
      : interpolate(scrollY.value, [ValueConstants.zero, layoutSizes.homeTitleShrink], [1, 0.82], Extrapolation.CLAMP);
    return { transform: [{ scale }] };
  });

  const eyebrowStyle = useAnimatedStyle(() => ({
    opacity: reduceMotion
      ? 1
      : interpolate(
          scrollY.value,
          [ValueConstants.zero, layoutSizes.homeTitleShrink * 0.5],
          [1, ValueConstants.zero],
          Extrapolation.CLAMP,
        ),
  }));

  const searchStyle = useAnimatedStyle(() => ({
    opacity: reduceMotion
      ? 1
      : interpolate(
          scrollY.value,
          [layoutSizes.homeTitleShrink * TITLE_SHRINK_MIDPOINT, layoutSizes.homeTitleShrink],
          [1, 0.55],
          Extrapolation.CLAMP,
        ),
  }));

  return (
    <Animated.View
      style={[styles.band, bandStyle, { top: insets.top, backgroundColor: colors.background }]}
    >
      <View style={styles.titleRow}>
        <View style={styles.titles}>
          <Animated.View style={eyebrowStyle}>
            <RecipelyLogo size={iconSizes.xl} />
          </Animated.View>
          <Animated.View style={[styles.titleScaleAnchor, titleStyle]}>
            <ThemedText variant="title" style={styles.screenTitle}>
              {t().recipes.title}
            </ThemedText>
          </Animated.View>
        </View>
        <Pressable
          onPress={onNotificationsPress}
          style={[styles.bell, { backgroundColor: colors.surface }]}
          accessibilityRole="button"
          accessibilityLabel={
            unreadCount > ValueConstants.zero
              ? `${t().notifications.title}, ${unreadCount}`
              : t().notifications.title
          }
        >
          <Ionicons
            name={unreadCount > ValueConstants.zero ? 'notifications' : 'notifications-outline'}
            size={iconSizes.xl}
            color={colors.text}
          />
          {unreadCount > ValueConstants.zero ? (
            <View style={[styles.badge, { backgroundColor: colors.danger, borderColor: colors.background }]}>
              <ThemedText style={styles.badgeText}>{badgeText}</ThemedText>
            </View>
          ) : null}
        </Pressable>
      </View>

      <Animated.View style={[styles.searchWrapper, searchStyle]}>
        <SearchBar
          value={searchValue}
          onChangeText={onSearchChange}
          placeholder={t().recipes.searchPlaceholder}
        />
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  band: {
    // `top` is applied inline as `insets.top` (see the component body) rather
    // than a static 0 — absolutely-positioned children ignore their parent
    // SafeAreaView's top padding, so this must be set explicitly per-render.
    position: 'absolute',
    left: ValueConstants.zero,
    right: ValueConstants.zero,
    height: layoutSizes.homeHeaderMax,
    zIndex: zIndices.stickyHeader,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: spacing.sm,
  },
  // The mark sits BESIDE the screen title, not stacked above it: two lines of
  // branding pushed the search field down the band for no information the one
  // line does not already carry.
  titles: {
    flex: ValueConstants.one,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  titleScaleAnchor: {
    alignSelf: 'flex-start',
    transformOrigin: 'left',
  },
  screenTitle: {
    fontWeight: fontWeights.bold,
  },
  bell: {
    width: controlSizes.iconBtn,
    height: controlSizes.iconBtn,
    borderRadius: radii.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: ValueConstants.zero,
    right: ValueConstants.zero,
    minWidth: decorSizes.notifBadge,
    height: decorSizes.notifBadge,
    paddingHorizontal: spacing.xs,
    borderRadius: radii.round,
    borderWidth: borderWidths.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: BrandColors.white,
    fontSize: fontSizes.nano,
    fontWeight: fontWeights.bold,
    lineHeight: decorSizes.notifBadgeLineHeight,
    includeFontPadding: false,
  },
  // Pinned to the bottom of the band. The title row got shorter when the mark
  // moved beside the title, and letting the search rise with it would have
  // moved the field the whole app's list padding is measured against.
  searchWrapper: {
    marginTop: 'auto',
    paddingBottom: spacing.sm,
  },
});
