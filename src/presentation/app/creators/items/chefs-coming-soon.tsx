import { StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { fontSizes, fontWeights, iconSizes, letterSpacings, lineHeights, radii, spacing } from '@presentation/base/theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { ChefsSoonHero } from '@presentation/app/creators/items/chefs-soon-hero';
import { GhostCreatorGrid } from '@presentation/app/creators/items/ghost-creator-grid';
import { CreatorApplyCard } from '@presentation/app/creators/items/creator-apply-card';
import { ChefsSoonMetrics } from '@presentation/app/creators/model/chefs-soon-metrics';
import { t } from '@presentation/i18n';

export interface ChefsComingSoonProps {
  onApply: () => void;
}

/**
 * The Chefs tab while no creator is approved yet (design spec → Chefs coming
 * soon): the chef-hat hero, a "Coming soon" pill, a title and one line, the
 * faded grid the page will become, and the creator call to action over it.
 */
export const ChefsComingSoon = ({ onApply }: ChefsComingSoonProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const strings = t().creators.comingSoon;
  return (
    <View style={styles.root}>
      <ChefsSoonHero />
      <View style={[styles.pill, { backgroundColor: colors.chipBackground }]}>
        <Ionicons name="sparkles" size={iconSizes.xs} color={colors.chipText} />
        <SizedText size={fontSizes.small} weight={fontWeights.bold} color={colors.chipText}>
          {strings.pill}
        </SizedText>
      </View>
      <SizedText size={fontSizes.display} weight={fontWeights.heavy} ratio={lineHeights.snug} accessibilityRole="header" style={styles.title}>
        {strings.title}
      </SizedText>
      <SizedText size={fontSizes.medium} ratio={lineHeights.normal} color={colors.textSubtle} style={styles.body}>
        {strings.body}
      </SizedText>
      <View style={styles.ghosts}>
        <GhostCreatorGrid />
      </View>
      <View style={styles.cta}>
        <CreatorApplyCard onApply={onApply} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    alignSelf: 'center',
    width: '100%',
    maxWidth: ChefsSoonMetrics.maxWidth,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: ChefsSoonMetrics.pill,
    paddingHorizontal: spacing.sm2,
    borderRadius: radii.round,
    marginTop: spacing.lg,
  },
  title: {
    marginTop: spacing.md,
    letterSpacing: letterSpacings.tight,
    textAlign: 'center',
  },
  body: {
    marginTop: spacing.sm,
    maxWidth: ChefsSoonMetrics.bodyMaxWidth,
    textAlign: 'center',
  },
  ghosts: {
    alignSelf: 'stretch',
    marginTop: spacing.xl,
  },
  cta: {
    alignSelf: 'stretch',
    marginTop: -ChefsSoonMetrics.ctaOverlap,
  },
});
