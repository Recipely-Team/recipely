import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { CreatorPlatform } from '@domain/creators/creator-platform';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { FormBanner } from '@presentation/base/widgets/feedback/form-banner';
import { CreatorPlatformMark } from '@presentation/base/widgets/creators/creator-platform-mark';
import { SeverityType } from '@presentation/base/theme/colors/surfaces/severity-type';
import { InstagramConnectPhase, type InstagramConnectPhaseType } from '@presentation/base/widgets/instagram/instagram-connect-phase';
import { AutomationMetrics } from '@presentation/base/widgets/instagram/automation-metrics';
import { controlSizes, fontSizes, fontWeights, lineHeights, opacities, radii, spacing } from '@presentation/base/theme';
import { t } from '@presentation/i18n';

export interface InstagramConnectBlockProps {
  phase: InstagramConnectPhaseType;
  onConnect: () => void;
  /** "Connect with Instagram", or "Reconnect" for an expired link. */
  label: string;
  /** Shows the why under the button (Edit Profile); the automations screen has its own title. */
  showBody: boolean;
  /** Opens the manual handle form instead; omitted where there is none. */
  onManual?: () => void;
}

/**
 * Connect with Instagram (Instagram automations spec → Connect button): a
 * full-width primary pill with the Instagram seal, "Waiting for Instagram…"
 * while the login is open, the cancelled notice above it, and the manual
 * handle form as a quiet text link below.
 */
export const InstagramConnectBlock = ({ phase, onConnect, label, showBody, onManual }: InstagramConnectBlockProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const copy = t().instagram;
  const waiting = phase === InstagramConnectPhase.Waiting;
  return (
    <View style={styles.block}>
      {phase === InstagramConnectPhase.Cancelled ? <FormBanner message={copy.cancelled} severity={SeverityType.Warning} /> : null}
      {showBody ? (
        <SizedText size={fontSizes.caption} ratio={lineHeights.normal} color={colors.textSubtle}>
          {copy.connectBody}
        </SizedText>
      ) : null}
      <Pressable
        onPress={onConnect}
        disabled={waiting}
        accessibilityRole="button"
        accessibilityState={{ disabled: waiting, busy: waiting }}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: colors.primary, opacity: waiting ? opacities.disabled : pressed ? opacities.pressed : opacities.full },
        ]}
      >
        {waiting ? <ActivityIndicator size="small" color={colors.primaryText} /> : <CreatorPlatformMark platform={CreatorPlatform.Instagram} size={AutomationMetrics.connectMark} />}
        <SizedText size={fontSizes.body} weight={fontWeights.bold} color={colors.primaryText}>
          {waiting ? copy.connecting : label}
        </SizedText>
      </Pressable>
      {onManual === undefined ? null : (
        <Pressable onPress={onManual} disabled={waiting} accessibilityRole="button" style={styles.manual}>
          <SizedText size={fontSizes.caption} weight={fontWeights.semibold} color={colors.textSubtle} style={styles.underline}>
            {copy.manual}
          </SizedText>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  block: { gap: spacing.md },
  button: {
    minHeight: AutomationMetrics.connectButton,
    borderRadius: radii.round,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  manual: { minHeight: controlSizes.touchTarget, alignItems: 'center', justifyContent: 'center' },
  underline: { textDecorationLine: 'underline' },
});
