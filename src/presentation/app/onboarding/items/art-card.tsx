import type { ReactNode } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { shadows } from '@presentation/base/theme/tokens/effects/shadows';
import { borderWidths, radii, spacing } from '@presentation/base/theme';
import { OnboardingReveal } from '@presentation/app/onboarding/items/onboarding-reveal';

export interface ArtCardProps {
  active: boolean;
  delay: number;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/** A card in a slide's stage art: `surface`, hairline `cardBorder`, soft shadow, rising in after `delay`. */
export const ArtCard = ({ active, delay, children, style }: ArtCardProps): React.JSX.Element => {
  const colors = useTheme().colors;
  return (
    <OnboardingReveal
      active={active}
      delay={delay}
      style={[styles.card, shadows.lg, { backgroundColor: colors.surface, borderColor: colors.cardBorder }, style]}
    >
      {children}
    </OnboardingReveal>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.xl,
    borderWidth: borderWidths.hairline,
    padding: spacing.md,
    gap: spacing.sm,
  },
});
