import { StyleSheet } from 'react-native';
import Animated, {
  interpolate,
  Extrapolation,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RecipelyLogo } from '@presentation/base/widgets/brand/recipely-logo';
import { TabAppBar } from '@presentation/base/widgets/navigation/tab-app-bar';
import { NotificationsBellButton } from '@presentation/base/widgets/navigation/notifications-bell-button';
import { SearchBar } from '@presentation/app/recipes/items/filters/search-bar';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, iconSizes, layoutSizes, zIndices } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';
import { HomeHeaderAnimation } from '@presentation/app/recipes/model/home-header-animation';

/** The title is half-way shrunk at the midpoint of the scroll, so the motion reads as continuous. */

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
  searchValue,
  onSearchChange,
}: CollapsingHomeHeaderProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const insets = useSafeAreaInsets();

  const bandStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: reduceMotion ? ValueConstants.zero : headerTranslateY.value }],
  }));

  const titleStyle = useAnimatedStyle(() => {
    const scale = reduceMotion
      ? ValueConstants.one
      : interpolate(
          scrollY.value,
          [ValueConstants.zero, layoutSizes.homeTitleShrink],
          HomeHeaderAnimation.titleScale,
          Extrapolation.CLAMP,
        );
    return { transform: [{ scale }] };
  });

  const eyebrowStyle = useAnimatedStyle(() => ({
    opacity: reduceMotion
      ? ValueConstants.one
      : interpolate(
          scrollY.value,
          [ValueConstants.zero, layoutSizes.homeTitleShrink * HomeHeaderAnimation.midpoint],
          HomeHeaderAnimation.eyebrowOpacity,
          Extrapolation.CLAMP,
        ),
  }));

  const searchStyle = useAnimatedStyle(() => ({
    opacity: reduceMotion
      ? ValueConstants.one
      : interpolate(
          scrollY.value,
          [layoutSizes.homeTitleShrink * HomeHeaderAnimation.midpoint, layoutSizes.homeTitleShrink],
          HomeHeaderAnimation.searchOpacity,
          Extrapolation.CLAMP,
        ),
  }));

  return (
    <Animated.View
      style={[styles.band, bandStyle, { top: insets.top, backgroundColor: colors.background }]}
    >
      <TabAppBar
        title={t().recipes.title}
        titleStyle={titleStyle}
        leading={
          <Animated.View style={eyebrowStyle}>
            <RecipelyLogo size={iconSizes.brandInline} />
          </Animated.View>
        }
        actions={<NotificationsBellButton />}
      />

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
    // top is set inline from insets: absolute children ignore the SafeAreaView padding.
    position: 'absolute',
    left: ValueConstants.zero,
    right: ValueConstants.zero,
    height: layoutSizes.homeHeaderMax,
    zIndex: zIndices.stickyHeader,
  },
  // Pinned to the band's bottom: list padding is measured against the field.
  searchWrapper: {
    marginTop: 'auto',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
});
