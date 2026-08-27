import { useState } from 'react';
import { FormBanner } from '@presentation/base/widgets/feedback/form-banner';
import { SeverityType } from '@presentation/base/theme/colors/surfaces/severity-type';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AssistantTranscript } from '@presentation/base/widgets/assistant/parts/assistant-transcript';
import { AutoGrowTextInput } from '@presentation/base/widgets/inputs/auto-grow-text-input';
import type { AssistantTranscriptLine } from '@application/assistant/session/assistant-transcript-line';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import {
  borderWidths,
  controlSizes,
  decorSizes,
  iconSizes,
  opacities,
  radii,
  spacing,
} from '@presentation/base/theme';
import { shadows } from '@presentation/base/theme/tokens/effects/shadows';
import { CharConstants, ValueConstants } from '@core/constants';
import { t } from '@presentation/i18n';

export interface AssistantSheetProps {
  height: number;
  transcript: AssistantTranscriptLine[];
  notice: string | null;
  /**
   * How loudly to show it. A failure used to render as the same muted caption
   * as a note about voice being off, and on the dark sheet it disappeared.
   */
  noticeTone: SeverityType;
  onSend: (text: string) => void;
  onCollapse: () => void;
}

/**
 * What was said, for when there is something to read.
 *
 * @remarks
 * - **It exists only while typing.** Talking does not need a transcript in the
 *   way; the orb carries the state, and the screen underneath is the thing the
 *   assistant is changing.
 * - **The grabber collapses it back to voice.** It is the affordance a sheet
 *   already promises, so it answers the gesture a user will try first —
 *   without pretending to be draggable, which a tap is not.
 */
export const AssistantSheet = ({
  height,
  transcript,
  notice,
  noticeTone,
  onSend,
  onCollapse,
}: AssistantSheetProps): React.JSX.Element => {
  const { colors } = useTheme();
  const [draft, setDraft] = useState(CharConstants.empty);
  const ready = draft.trim() !== CharConstants.empty;

  const submit = (): void => {
    if (!ready) return;
    onSend(draft.trim());
    setDraft(CharConstants.empty);
  };

  return (
    <View
      style={[
        styles.sheet,
        shadows.lg,
        { height, backgroundColor: colors.cardBackground, borderTopColor: colors.cardBorder },
      ]}
    >
      <Pressable
        onPress={onCollapse}
        accessibilityRole="button"
        accessibilityLabel={t().assistant.voice}
        style={styles.grabberRow}
      >
        <View style={[styles.grabber, { backgroundColor: colors.cardBorder }]} />
      </Pressable>

      {notice !== null ? (
        noticeTone === SeverityType.Neutral ? (
          <ThemedText variant="caption" muted style={styles.notice}>
            {notice}
          </ThemedText>
        ) : (
          <View style={styles.noticeBanner}>
            <FormBanner
              message={notice}
              severity={noticeTone}
              icon={noticeTone === SeverityType.Danger ? 'alert-circle' : 'time-outline'}
            />
          </View>
        )
      ) : null}

      <View style={styles.transcript}>
        <AssistantTranscript lines={transcript} />
      </View>

      <View style={styles.composer}>
        <AutoGrowTextInput
          value={draft}
          onChangeText={setDraft}
          placeholder={t().assistant.placeholder}
          minHeight={controlSizes.searchBar}
          style={styles.input}
        />
        <Pressable
          onPress={submit}
          accessibilityRole="button"
          accessibilityLabel={t().assistant.send}
          disabled={!ready}
          style={[
            styles.send,
            {
              backgroundColor: ready ? colors.primary : colors.surface,
              borderColor: ready ? colors.primary : colors.cardBorder,
              opacity: ready ? opacities.full : opacities.disabledFaint,
            },
          ]}
        >
          <Ionicons
            name="arrow-up"
            size={iconSizes.lg}
            color={ready ? colors.primaryText : colors.textMuted}
          />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: ValueConstants.zero,
    right: ValueConstants.zero,
    bottom: ValueConstants.zero,
    borderTopLeftRadius: radii.xxl,
    borderTopRightRadius: radii.xxl,
    borderTopWidth: borderWidths.hairline,
  },
  grabberRow: { paddingVertical: spacing.sm, alignItems: 'center' },
  // Pinned: a bar, not a text box.
  grabber: { width: decorSizes.cardOverlap, height: spacing.xs, borderRadius: radii.xs },
  noticeBanner: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  notice: { paddingHorizontal: spacing.md, paddingBottom: spacing.xs },
  transcript: { flex: ValueConstants.one, minHeight: ValueConstants.zero, paddingHorizontal: spacing.md },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    padding: spacing.md,
  },
  input: { flex: ValueConstants.one },
  // Pinned: a circle, not a text box.
  send: {
    width: controlSizes.searchBar,
    height: controlSizes.searchBar,
    borderRadius: radii.round,
    borderWidth: borderWidths.hairline,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: ValueConstants.zero,
  },
});
