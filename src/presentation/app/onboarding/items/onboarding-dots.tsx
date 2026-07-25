import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, decorSizes, opacities } from '@presentation/base/theme';
import { t } from '@presentation/i18n';

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
            style={[
              styles.dot,
              {
                width: active ? decorSizes.dotActiveWidth : DOT_SIZE,
                backgroundColor: colors.primary,
                opacity: active ? opacities.full : opacities.inactive,
              },
            ]}
          />
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
    gap: spacing.xs2,
  },
  dot: {
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
  },
});
