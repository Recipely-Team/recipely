import { useState } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { AssistantOrb } from '@presentation/base/widgets/assistant/parts/assistant-orb';
import { AssistantWaitingLine } from '@presentation/base/widgets/assistant/parts/assistant-waiting-line';
import { AssistantOrbMenu } from '@presentation/base/widgets/assistant/views/assistant-orb-menu';
import { AssistantSheet } from '@presentation/base/widgets/assistant/views/assistant-sheet';
import { AssistantStatus, type AssistantStatusType } from '@application/assistant/session/assistant-status';
import type { AssistantTranscriptLine } from '@application/assistant/session/assistant-transcript-line';
import { assistantIsLive } from '@application/assistant/session/assistant-is-live';
import { assistantMetrics } from '@presentation/base/widgets/assistant/assistant-metrics';
import { spacing } from '@presentation/base/theme';
import { t } from '@presentation/i18n';

export interface AssistantOrbSurfaceProps {
  status: AssistantStatusType;
  level: number;
  isMuted: boolean;
  transcript: AssistantTranscriptLine[];
  notice: string | null;
  onToggleVoice: () => void;
  onToggleMute: () => void;
  onSend: (text: string) => void;
  onClose: () => void;
  /** How far the screen's own chrome already reserves at the bottom edge. */
  restingBottom: number;
}

/**
 * The assistant on a phone: one object, and what it opens.
 *
 * @remarks
 * - **No panel while talking.** Speaking to it does not need a transcript in
 *   the way, and the screen it is driving is the thing worth seeing. The orb
 *   carries the state on its own surface; the words are for when there are
 *   words to read.
 * - **Connecting says so.** The orb sweeps a light across itself, but a
 *   sweep is not a sentence: the line names what is happening for the second
 *   or two before it can hear anything.
 * - **Tapping the orb offers three things**, which is all there is: change how
 *   you are talking to it, silence it, or end it.
 * - **Typing raises a sheet and lifts the orb clear of it**, so the object you
 *   are talking to never disappears behind the thing you are typing into.
 */
export const AssistantOrbSurface = ({
  status,
  level,
  isMuted,
  transcript,
  notice,
  onToggleVoice,
  onToggleMute,
  onSend,
  onClose,
  restingBottom,
}: AssistantOrbSurfaceProps): React.JSX.Element => {
  const { height } = useWindowDimensions();
  const [isTyping, setIsTyping] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const live = assistantIsLive(status);

  const sheetHeight = height * assistantMetrics.sheetHeightShare;
  // The design floats it about an eighth up the screen; the floor is whatever
  // the screen underneath has already claimed — its tab bar and its own
  // floating control — because the orb landing on the button a screen exists
  // to offer is the same mistake the launcher made.
  const orbBottom = isTyping
    ? sheetHeight + spacing.lg
    : Math.max(height * ORB_RESTING_SHARE, restingBottom);

  const items = [
    {
      key: 'voice',
      icon: (live && isMuted ? 'mic-off' : 'mic') as 'mic' | 'mic-off',
      label: !live ? t().assistant.start : isMuted ? t().assistant.unmute : t().assistant.mute,
      isOn: live && isMuted,
      onPress: () => {
        setIsMenuOpen(false);
        if (!live) onToggleVoice();
        else onToggleMute();
      },
    },
    {
      key: 'text',
      icon: 'chatbubble-ellipses-outline' as const,
      label: isTyping ? t().assistant.voice : t().assistant.keyboard,
      isOn: isTyping,
      onPress: () => {
        setIsMenuOpen(false);
        setIsTyping((typing) => !typing);
      },
    },
    {
      key: 'end',
      icon: 'close' as const,
      label: t().assistant.close,
      isDanger: true,
      onPress: () => {
        setIsMenuOpen(false);
        onClose();
      },
    },
  ];

  return (
    <>
      {isMenuOpen ? (
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => setIsMenuOpen(false)}
          accessibilityRole="button"
          accessibilityLabel={t().assistant.close}
        />
      ) : null}

      {isTyping ? (
        <AssistantSheet
          height={sheetHeight}
          transcript={transcript}
          notice={notice}
          onSend={onSend}
          onCollapse={() => setIsTyping(false)}
        />
      ) : null}

      <View style={[styles.dock, { bottom: orbBottom }]} pointerEvents="box-none">
        {isMenuOpen ? <AssistantOrbMenu items={items} /> : null}

        <AssistantWaitingLine status={status} isMuted={isMuted} />

        <Pressable
          onPress={() => setIsMenuOpen((open) => !open)}
          accessibilityRole="button"
          accessibilityLabel={t().assistant.title}
          accessibilityValue={{ text: assistantStatusValue(status, isMuted) }}
        >
          <AssistantOrb status={status} level={level} isMuted={isMuted} />
        </Pressable>
      </View>
    </>
  );
};

/** Roughly an eighth up the screen — clear of the tab bar, under the thumb. */
const ORB_RESTING_SHARE = 0.13;

function assistantStatusValue(status: AssistantStatusType, isMuted: boolean): string {
  if (isMuted) return t().assistant.unmute;
  return status === AssistantStatus.Idle ? t().assistant.idle : t().assistant.listening;
}

const styles = StyleSheet.create({
  dock: { position: 'absolute', right: spacing.lg, alignItems: 'flex-end', gap: spacing.md },
});
