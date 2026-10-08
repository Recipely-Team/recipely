import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { useLayout } from '@presentation/base/responsive/use-layout';
import { fontSizes, fontWeights, letterSpacings, lineHeights, spacing } from '@presentation/base/theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { TabAppBar } from '@presentation/base/widgets/navigation/tab-app-bar';
import { NotificationsBellButton } from '@presentation/base/widgets/navigation/notifications-bell-button';
import { CreatorsGridMetrics } from '@presentation/app/creators/model/creators-grid-metrics';
import { t } from '@presentation/i18n';

export interface ChefsHeadingProps {
  /** The subtitle describes the grid, so it hides while there are no chefs yet. */
  showSubtitle: boolean;
}

/**
 * The Chefs tab's title and subtitle — a root tab, so no back button.
 *
 * @remarks
 * - **Phone:** the shared tab app bar with the bell, then the 13 subtitle 12 above the grid
 *   (design spec → Tab app bar).
 * - **Web:** a 36/800 h1 40 below the header, subtitle 15 (design spec → Chefs tab §5).
 */
export const ChefsHeading = ({ showSubtitle }: ChefsHeadingProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const insets = useSafeAreaInsets();
  const { isWebShell } = useLayout();

  if (!isWebShell) {
    return (
      <View style={{ paddingTop: insets.top }}>
        <TabAppBar title={t().creators.title} actions={<NotificationsBellButton />} />
        {showSubtitle ? (
          <SizedText size={fontSizes.caption} ratio={lineHeights.normal} color={colors.textSubtle} style={styles.subtitle}>
            {t().creators.listSubtitle}
          </SizedText>
        ) : null}
      </View>
    );
  }

  return (
    <View style={[styles.heading, { paddingTop: CreatorsGridMetrics.webTopPadding }]}>
      <SizedText size={fontSizes.pageHeading} weight={fontWeights.heavy} accessibilityRole="header" style={styles.h1}>
        {t().creators.title}
      </SizedText>
      {showSubtitle ? (
        <SizedText size={fontSizes.body} ratio={lineHeights.normal} color={colors.textSubtle} style={styles.subtitleWeb}>
          {t().creators.listSubtitle}
        </SizedText>
      ) : null}
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
    paddingHorizontal: CreatorsGridMetrics.gutter,
    marginBottom: spacing.md,
  },
  subtitleWeb: {
    marginTop: spacing.xxs,
    marginBottom: CreatorsGridMetrics.webSubtitleGap,
  },
});
