import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { CreatorPlatform } from '@domain/creators/creator-platform';
import { CharConstants, ValueConstants } from '@core/constants';
import type { InstagramConnection } from '@domain/instagram/connect/instagram-connection';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { FormBanner } from '@presentation/base/widgets/feedback/form-banner';
import { CreatorPlatformMark } from '@presentation/base/widgets/creators/creator-platform-mark';
import { creatorMarkGeometry } from '@presentation/base/widgets/creators/creator-mark-geometry';
import { InstagramConnectBlock } from '@presentation/base/widgets/instagram/instagram-connect-block';
import type { InstagramConnectPhaseType } from '@presentation/base/widgets/instagram/instagram-connect-phase';
import { SeverityType } from '@presentation/base/theme/colors/surfaces/severity-type';
import { useSeveritySurfaces } from '@presentation/base/theme/colors/surfaces/use-severity-surfaces';
import { CreatorRowAction } from '@presentation/app/edit-profile/items/creator-row-action';
import { AutomationMetrics } from '@presentation/base/widgets/instagram/automation-metrics';
import { borderWidths, controlSizes, fontSizes, fontWeights, iconSizes, opacities, radii, spacing } from '@presentation/base/theme';
import { t, useLocale } from '@presentation/i18n';

export interface InstagramConnectedRowProps {
  connection: InstagramConnection;
  phase: InstagramConnectPhaseType;
  isBusy: boolean;
  onReconnect: () => void;
  onDisconnect: () => void;
  onOpenAutomations: () => void;
}

/**
 * The Instagram row once linked through Instagram's login (spec §1):
 * `@handle`, "Verified via Instagram", Approved, the way into Automations,
 * Disconnect — and, once Instagram stops accepting the link, the expiry
 * notice with Reconnect.
 */
export const InstagramConnectedRow = (props: InstagramConnectedRowProps): React.JSX.Element => {
  const { connection } = props;
  const colors = useTheme().colors;
  const success = useSeveritySurfaces()[SeverityType.Success];
  const locale = useLocale();
  const copy = t().instagram;
  const expiry = connection.tokenExpiresAt?.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' }) ?? CharConstants.emDash;
  return (
    <View role="status" accessibilityLiveRegion="polite" style={styles.row}>
      <View style={styles.head}>
        <CreatorPlatformMark platform={CreatorPlatform.Instagram} size={creatorMarkGeometry.row} />
        <View style={styles.names}>
          <SizedText size={fontSizes.body} weight={fontWeights.bold} numberOfLines={ValueConstants.one}>
            {connection.displayHandle}
          </SizedText>
          <View style={styles.verified}>
            <Ionicons name="shield-checkmark" size={iconSizes.xs} color={colors.primary} />
            <SizedText size={fontSizes.small} color={colors.textSubtle}>
              {copy.viaInstagram}
            </SizedText>
          </View>
        </View>
        <View style={[styles.pill, { backgroundColor: success.bg, borderColor: success.border }]}>
          <SizedText size={fontSizes.micro} weight={fontWeights.bold} color={success.text}>
            {copy.approved}
          </SizedText>
        </View>
      </View>
      {connection.isExpired ? (
        <>
          <FormBanner message={copy.expired.replace('{date}', expiry)} severity={SeverityType.Warning} />
          <InstagramConnectBlock phase={props.phase} onConnect={props.onReconnect} label={copy.reconnect} showBody={false} />
        </>
      ) : (
        <Pressable
          onPress={props.onOpenAutomations}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.automations,
            { borderColor: colors.cardBorder, backgroundColor: colors.background, opacity: pressed ? opacities.pressed : opacities.full },
          ]}
        >
          <Ionicons name="paper-plane-outline" size={iconSizes.lg} color={colors.primary} />
          <View style={styles.names}>
            <SizedText size={fontSizes.medium} weight={fontWeights.bold}>
              {copy.automations}
            </SizedText>
            <SizedText size={fontSizes.small} color={colors.textSubtle} numberOfLines={ValueConstants.one}>
              {copy.automationsSub}
            </SizedText>
          </View>
          <Ionicons name="chevron-forward" size={iconSizes.md} color={colors.textMuted} />
        </Pressable>
      )}
      <CreatorRowAction label={copy.disconnect} primary={false} loading={false} disabled={props.isBusy} onPress={props.onDisconnect} />
    </View>
  );
};

const styles = StyleSheet.create({
  row: { padding: spacing.lg, gap: spacing.md },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  names: { flex: ValueConstants.one, minWidth: ValueConstants.zero, gap: spacing.xxs },
  verified: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  pill: {
    minHeight: AutomationMetrics.statusPill,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.round,
    borderWidth: borderWidths.hairline,
    justifyContent: 'center',
  },
  automations: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: controlSizes.touchTarget + spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.lg,
    borderWidth: borderWidths.hairline,
  },
});
