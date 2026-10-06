import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { decorSizes, opacities, targetSizes } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

const DOT_SIZE = 7;

export interface OnboardingDotsProps {
  count: number;
  index: number;
  onSelect: (index: number) => void;
}

/** Carousel position indicator; the active dot stretches into a pill. */
export const OnboardingDots = ({ count, index, onSelect }: OnboardingDotsProps): React.JSX.Element => {
  const colors = useTheme().colors;
  return (
    <View style={styles.row}>
      {Array.from({ length: count }).map((_, i) => {
        const active = i === index;
        return (
          <Pressable
            key={i}
            onPress={() => onSelect(i)}
            accessibilityRole="button"
            accessibilityLabel={t().onboarding.slideLabel}
            accessibilityState={{ selected: active }}
            style={styles.target}
          >
            <View
              style={[
                styles.dot,
                {
                  width: active ? decorSizes.dotActiveWidth : DOT_SIZE,
                  backgroundColor: colors.primary,
                  opacity: active ? opacities.full : opacities.inactive,
                },
              ]}
            />
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  target: {
    minWidth: targetSizes.min,
    minHeight: targetSizes.min,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / ValueConstants.two,
  },
});
