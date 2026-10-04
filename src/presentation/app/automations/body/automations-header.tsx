import { StyleSheet, View } from 'react-native';
import { CreatorPlatform } from '@domain/creators/creator-platform';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { FormBanner } from '@presentation/base/widgets/feedback/form-banner';
import { CreatorPlatformMark } from '@presentation/base/widgets/creators/creator-platform-mark';
import { InstagramConnectBlock } from '@presentation/base/widgets/instagram/instagram-connect-block';
import type { InstagramConnectPhaseType } from '@presentation/base/widgets/instagram/instagram-connect-phase';
import { AutomationMetrics } from '@presentation/base/widgets/instagram/automation-metrics';
import { SeverityType } from '@presentation/base/theme/colors/surfaces/severity-type';
import { fontSizes, fontWeights, spacing } from '@presentation/base/theme';
import { t } from '@presentation/i18n';

export interface AutomationsHeaderProps {
  handle: string;
  isPaused: boolean;
  phase: InstagramConnectPhaseType;
  onReconnect: () => void;
}

/** Above the rules: what automations do, the account they run on, and — once the link expired — Paused with Reconnect. */
export const AutomationsHeader = ({ handle, isPaused, phase, onReconnect }: AutomationsHeaderProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const copy = t().instagram;
  return (
    <View style={styles.header}>
      <SizedText size={fontSizes.caption} color={colors.textSubtle}>
        {copy.automationsSub}
      </SizedText>
      <View style={styles.account}>
        <CreatorPlatformMark platform={CreatorPlatform.Instagram} size={AutomationMetrics.connectMark} />
        <SizedText size={fontSizes.medium} weight={fontWeights.bold}>
          {handle}
        </SizedText>
      </View>
      {isPaused ? (
        <>
          <FormBanner message={copy.pausedBanner} severity={SeverityType.Warning} />
          <InstagramConnectBlock phase={phase} onConnect={onReconnect} label={copy.reconnect} showBody={false} />
        </>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  header: { gap: spacing.md, paddingBottom: spacing.md },
  account: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
