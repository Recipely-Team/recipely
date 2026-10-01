import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { useLayout } from '@presentation/base/responsive/use-layout';
import { fontSizes, fontWeights, letterSpacings, lineHeights, spacing } from '@presentation/base/theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { CreatorsGridMetrics } from '@presentation/app/creators/model/creators-grid-metrics';
import { t } from '@presentation/i18n';

/**
 * The Chefs tab's title and subtitle — a root tab, so no back button (design
 * spec → Chefs tab §5). Phone: 24/700 under the safe area, subtitle 13; web:
 * a 36/800 h1 40 below the header, subtitle 15.
 */
export const ChefsHeading = (): React.JSX.Element => {
  const colors = useTheme().colors;
  const insets = useSafeAreaInsets();
  const { isWebShell } = useLayout();

  return (
    <View style={[styles.heading, { paddingTop: isWebShell ? CreatorsGridMetrics.webTopPadding : insets.top + spacing.md }]}>
      <SizedText
        size={isWebShell ? fontSizes.pageHeading : fontSizes.title}
        weight={isWebShell ? fontWeights.heavy : fontWeights.bold}
        accessibilityRole="header"
        style={isWebShell ? styles.h1 : null}
      >
        {t().creators.title}
      </SizedText>
      <SizedText
        size={isWebShell ? fontSizes.body : fontSizes.caption}
        ratio={lineHeights.normal}
        color={colors.textSubtle}
        style={isWebShell ? styles.subtitleWeb : styles.subtitle}
      >
        {t().creators.listSubtitle}
      </SizedText>
    </View>
  );
};

const styles = StyleSheet.create({
  heading: {
    paddingHorizontal: CreatorsGridMetrics.gutter,
  },
  h1: {
    letterSpacing: letterSpacings.tight,
  },
  subtitle: {
    marginTop: spacing.xxs,
    marginBottom: spacing.md,
  },
  subtitleWeb: {
    marginTop: spacing.xxs,
    marginBottom: CreatorsGridMetrics.webSubtitleGap,
  },
});
