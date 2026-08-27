import { useRef, useState } from 'react';
import { scrollThrottleMs } from '@presentation/base/constants';
import {
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { RecipelyLogo } from '@presentation/base/widgets/brand/recipely-logo';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, fontSizes, fontWeights, letterSpacings } from '@presentation/base/theme';
import { ValueConstants } from '@core/constants';
import { OnboardingSlide } from '@presentation/app/onboarding/items/onboarding-slide';
import { OnboardingDots } from '@presentation/app/onboarding/items/onboarding-dots';
import { OnboardingActions } from '@presentation/app/onboarding/items/onboarding-actions';
import type { OnboardingSlide as OnboardingSlideModel } from '@presentation/app/onboarding/model/onboarding-slide';
import type { UseOnboardingResult } from '@presentation/app/onboarding/model/use-onboarding-result';

const LOGO_SIZE = 26;
const TOP_INSET_MIN = 52;

export interface OnboardingMobileProps {
  slides: OnboardingSlideModel[];
  actions: UseOnboardingResult;
}

/** Full-screen mobile welcome gate: brand mark, swipeable carousel, entry actions. */
export const OnboardingMobile = ({ slides, actions }: OnboardingMobileProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [size, setSize] = useState({ width: ValueConstants.zero, height: ValueConstants.zero });
  const [index, setIndex] = useState(ValueConstants.zero);
  const width = size.width;

  const onLayout = (e: LayoutChangeEvent): void => {
    const { width: w, height: h } = e.nativeEvent.layout;
    setSize({ width: w, height: h });
  };
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>): void => {
    if (width === ValueConstants.zero) return;
    const next = Math.round(e.nativeEvent.contentOffset.x / width);
    if (next !== index) setIndex(next);
  };
  const goToSlide = (i: number): void => {
    setIndex(i);
    scrollRef.current?.scrollTo({ x: i * width, animated: true });
  };

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: colors.background,
          paddingTop: Math.max(TOP_INSET_MIN, insets.top),
        },
      ]}
    >
      <View style={styles.brand}>
        <RecipelyLogo size={LOGO_SIZE} />
        <ThemedText style={styles.wordmark}>Recipely</ThemedText>
      </View>

      <View style={styles.carousel} onLayout={onLayout}>
        {width > ValueConstants.zero ? (
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onScroll}
            scrollEventThrottle={scrollThrottleMs.perFrame}
          >
            {slides.map((slide, i) => (
              <OnboardingSlide
                key={slide.kind}
                slide={slide}
                width={width}
                height={size.height}
                active={i === index}
              />
            ))}
          </ScrollView>
        ) : null}
      </View>

      <View style={styles.dots}>
        <OnboardingDots count={slides.length} index={index} onSelect={goToSlide} />
      </View>

      <View style={[styles.actions, { paddingBottom: insets.bottom + spacing.lg2 }]}>
        <OnboardingActions {...actions} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: ValueConstants.one,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingTop: spacing.xxs,
    paddingBottom: spacing.sm2,
  },
  wordmark: {
    fontSize: fontSizes.subheading,
    fontWeight: fontWeights.heavy,
    letterSpacing: letterSpacings.tighter,
  },
  carousel: {
    flex: ValueConstants.one,
    minHeight: ValueConstants.zero,
  },
  dots: {
    paddingVertical: spacing.lg,
  },
  actions: {
    paddingHorizontal: spacing.lg2,
  },
});
