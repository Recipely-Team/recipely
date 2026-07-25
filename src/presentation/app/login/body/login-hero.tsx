import { StyleSheet, View } from 'react-native';
import { RecipelyLogo } from '@presentation/base/widgets/brand/recipely-logo';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, layoutSizes, opacities } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

export interface LoginHeroProps {
  isLandscapeShell: boolean;
}

/** Brand mark + title/subtitle shown atop the login screen's gradient. */
export const LoginHero = ({ isLandscapeShell }: LoginHeroProps): React.JSX.Element => {
  const colors = useTheme().colors;

  return (
    <View style={[styles.gradientContent, isLandscapeShell ? styles.heroLandscape : null]}>
      <RecipelyLogo size={isLandscapeShell ? 96 : 72} monochrome mono={colors.onOverlay} />
      <ThemedText variant="headline" style={[styles.appName, { color: colors.onOverlay }]}>
        {t().login.title}
      </ThemedText>
      <ThemedText variant="body" style={[styles.gradientSubtitle, { color: colors.onOverlay }]}>
        {t().login.subtitle}
      </ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  gradientContent: {
    alignItems: 'center',
    paddingTop: '15%',
  },
  heroLandscape: {
    paddingTop: ValueConstants.zero,
    maxWidth: layoutSizes.maxContentLg,
  },
  appName: {
    marginTop: spacing.md,
  },
  gradientSubtitle: {
    marginTop: spacing.sm,
    textAlign: 'center',
    paddingHorizontal: spacing.xxl,
    opacity: opacities.pressedLight,
  },
});
