import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { AssistantDenialReason, type AssistantDenialReasonType } from '@domain/assistant/session/assistant-denial-reason';
import { FormBanner } from '@presentation/base/widgets/feedback/form-banner';
import { SeverityType } from '@presentation/base/theme/colors/surfaces/severity-type';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { isWeb } from '@infrastructure/constants/platform';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { opacities, spacing, radii } from '@presentation/base/theme';
import { shadows } from '@presentation/base/theme/tokens/effects/shadows';
import { t } from '@presentation/i18n';

export interface AssistantNoticeBlockProps {
  /** The line to show, or `null` when voice is working and there is no news. */
  notice: string | null;
  noticeTone: SeverityType;
  /** Why voice is unavailable, when something said why. */
  deniedReason: AssistantDenialReasonType | null;
  /** True while a request failed — a different kind of news from a refusal. */
  hasError: boolean;
}

/**
 * What the assistant panel says when voice is not available, and what the user can do about it.
 *
 * @remarks
 * - **A failure gets the app's own error surface** rather than a caption on a
 *   card: on the dark panel the two were indistinguishable, and the one that
 *   mattered was the one nobody saw.
 * - **A denied microphone is the one notice the user can still act on, and the
 *   only one they cannot act on from here.** iOS shows its permission prompt
 *   exactly once ever; after that `requestRecordingPermissions()` answers
 *   "Denied" immediately and draws nothing, so the sentence alone was a dead end
 *   that reappeared on every press and never asked again. Settings is where the
 *   decision lives by then, so that is where this leads.
 * - **Native only for that action.** On the web the permission belongs to the
 *   browser and `openSettings` has nothing to open. And only for a denied
 *   microphone — Settings cannot fix a daily limit or an unreachable backend,
 *   and a button that goes somewhere useless is worse than no button.
 */
export const AssistantNoticeBlock = ({
  notice,
  noticeTone,
  deniedReason,
  hasError,
}: AssistantNoticeBlockProps): React.JSX.Element | null => {
  const colors = useTheme().colors;

  if (notice === null) return null;

  const showsSettingsAction =
    !hasError && deniedReason === AssistantDenialReason.MicrophoneDenied && !isWeb();

  return (
    <>
      {noticeTone === SeverityType.Neutral ? (
        <View style={[styles.notice, shadows.md, { backgroundColor: colors.cardBackground }]}>
          <ThemedText variant="caption">{notice}</ThemedText>
        </View>
      ) : (
        <View style={styles.notice}>
          <FormBanner
            message={notice}
            severity={noticeTone}
            icon={noticeTone === SeverityType.Danger ? 'alert-circle' : 'time-outline'}
          />
        </View>
      )}

      {showsSettingsAction ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t().common.openSettings}
          onPress={() => void Linking.openSettings().catch(() => undefined)}
          style={({ pressed }) => [
            styles.settingsAction,
            { opacity: pressed ? opacities.pressed : opacities.full },
          ]}
        >
          <ThemedText variant="caption" style={{ color: colors.primary }}>
            {t().common.openSettings}
          </ThemedText>
        </Pressable>
      ) : null}
    </>
  );
};

const styles = StyleSheet.create({
  // Carried verbatim from AssistantPanel, where this block used to live.
  notice: {
    alignSelf: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.round,
  },
  settingsAction: { alignSelf: 'center', paddingVertical: spacing.xs, paddingHorizontal: spacing.sm },
});
