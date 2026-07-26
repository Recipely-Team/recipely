import { StyleSheet, View } from 'react-native';
import { RecipelyLogo } from '@presentation/base/widgets/brand/recipely-logo';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, iconSizes, mediaSizes, layoutSizes, opacities } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

export interface RegisterHeroProps {
  isLandscapeShell: boolean;
}

/** Brand mark + title/subtitle shown atop the register screen's gradient. */
export const RegisterHero = ({ isLandscapeShell }: RegisterHeroProps): React.JSX.Element => {
  const colors = useTheme().colors;

  return (
    <View style={[styles.gradientContent, isLandscapeShell ? styles.heroLandscape : null]}>
      <RecipelyLogo size={isLandscapeShell ? mediaSizes.heroLogo : iconSizes.giant} monochrome mono={colors.onOverlay} />
      <ThemedText variant="headline" style={[styles.title, { color: colors.onOverlay }]}>
        {t().register.title}
      </ThemedText>
      <ThemedText variant="body" style={[styles.subtitle, { color: colors.onOverlay }]}>
        {t().register.subtitle}
      </ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  gradientContent: {
    alignItems: 'center',
    paddingTop: layoutSizes.heroPaddingTop,
    paddingBottom: spacing.xl,
  },
  heroLandscape: {
    paddingTop: ValueConstants.zero,
    paddingBottom: ValueConstants.zero,
    maxWidth: layoutSizes.maxContentXl,
  },
  title: {
    marginTop: spacing.sm2,
  },
  subtitle: {
    marginTop: spacing.xs2,
    textAlign: 'center',
    paddingHorizontal: spacing.xxl,
    opacity: opacities.pressedFaint,
  },
});
