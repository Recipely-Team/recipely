import { StyleSheet, View } from 'react-native';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { fontSizes, fontWeights, radii, spacing } from '@presentation/base/theme';
import { OnboardingReveal } from '@presentation/app/onboarding/items/onboarding-reveal';

export interface ArtChipProps {
  label: string;
  active: boolean;
  delay: number;
  /** A highlighted chip uses `primary`; others `chipBackground` / `chipText`. */
  strong?: boolean;
}

/** A small rounded chip in a slide's art, rising in after `delay`. */
export const ArtChip = ({ label, active, delay, strong = false }: ArtChipProps): React.JSX.Element => {
  const colors = useTheme().colors;
  return (
    <OnboardingReveal active={active} delay={delay}>
      <View style={[styles.chip, { backgroundColor: strong ? colors.primary : colors.chipBackground }]}>
        <SizedText size={fontSizes.tiny} weight={fontWeights.bold} color={strong ? colors.primaryText : colors.chipText}>
          {label}
        </SizedText>
      </View>
    </OnboardingReveal>
  );
};

const styles = StyleSheet.create({
  chip: { paddingVertical: spacing.xxs, paddingHorizontal: spacing.sm, borderRadius: radii.round },
});
