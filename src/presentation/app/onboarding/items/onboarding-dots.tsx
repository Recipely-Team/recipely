import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { opacities, radii, targetSizes } from '@presentation/base/theme';
import { useTranslations } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

const DOT_SIZE = 6;
/** The active dot stretches to hold the autoplay progress (Onboarding 2026). */
const ACTIVE_WIDTH = 28;
const DOT_GAP = 6;
/** Inactive dots and the active track sit on `textMuted`, faint. */
const TRACK_OPACITY = 0.3;

export interface OnboardingDotsProps {
  count: number;
  index: number;
  onSelect: (index: number) => void;
  /** 0→1 fill of the active dot while autoplay runs; absent = fully filled. */
  progress?: Animated.Value | undefined;
}

/** Page dots: tap to go to a slide; the active one fills as autoplay counts down. */
export const OnboardingDots = ({ count, index, onSelect, progress }: OnboardingDotsProps): React.JSX.Element => {
  const t = useTranslations();
  const colors = useTheme().colors;
  return (
    <View style={styles.row}>
      {Array.from({ length: count }).map((_, i) => {
        const isActive = i === index;
        return (
          <Pressable
            key={i}
            onPress={() => onSelect(i)}
            accessibilityRole="tab"
            accessibilityLabel={`${t.onboarding.slideLabel} ${i + ValueConstants.one} / ${count}`}
            accessibilityState={{ selected: isActive }}
            style={styles.target}
          >
            <View style={[styles.dot, { width: isActive ? ACTIVE_WIDTH : DOT_SIZE }]}>
              <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.textMuted, opacity: TRACK_OPACITY }]} />
              {isActive ? (
                <Animated.View
                  style={[
                    StyleSheet.absoluteFill,
                    styles.fill,
                    { backgroundColor: colors.primary, opacity: opacities.full },
                    progress !== undefined ? { transform: [{ scaleX: progress }] } : null,
                  ]}
                />
              ) : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: DOT_GAP },
  target: { minHeight: targetSizes.min, justifyContent: 'center' },
  dot: { height: DOT_SIZE, borderRadius: radii.round, overflow: 'hidden' },
  fill: { transformOrigin: 'left' },
});
