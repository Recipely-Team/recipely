import { useCallback } from 'react';
import type { AssistantDenialReasonType } from '@domain/assistant/session/assistant-denial-reason';
import { AssistantStatus, type AssistantStatusType } from '@application/assistant/session/assistant-status';
import type { AssistantTranscriptLine } from '@application/assistant/session/assistant-transcript-line';
import { useLocale } from '@presentation/i18n/use-locale';
import { useStores } from '@presentation/bootstrap/use-stores';

interface AssistantSessionView {
  status: AssistantStatusType;
  isPanelOpen: boolean;
  transcript: AssistantTranscriptLine[];
  remainingSeconds: number;
  deniedReason: AssistantDenialReasonType | null;
  openPanel: () => void;
  closePanel: () => void;
  toggleVoice: () => void;
  sendText: (text: string) => void;
}

/**
 * The assistant, as a screen sees it.
 *
 * @remarks
 * - **One toggle, not start and stop.** The pill is a single control, and a
 *   caller deciding which of two calls to make would be re-deriving state the
 *   store already holds — and getting it wrong while connecting.
 * - **The language comes from the app's locale**, not from the device's, so the
 *   assistant answers in the language the user chose to read the app in. It is
 *   fixed at mint time, which is why it is read here and not later.
 */
export const useAssistantSession = (): AssistantSessionView => {
  const { assistantSessionStore } = useStores();
  const locale = useLocale();

  const status = assistantSessionStore((s) => s.status);
  const isPanelOpen = assistantSessionStore((s) => s.isPanelOpen);
  const transcript = assistantSessionStore((s) => s.transcript);
  const remainingSeconds = assistantSessionStore((s) => s.remainingSeconds);
  const deniedReason = assistantSessionStore((s) => s.deniedReason);
  const openPanel = assistantSessionStore((s) => s.openPanel);
  const closePanel = assistantSessionStore((s) => s.closePanel);
  const startVoice = assistantSessionStore((s) => s.startVoice);
  const stopVoice = assistantSessionStore((s) => s.stopVoice);
  const send = assistantSessionStore((s) => s.sendText);
  const sendText = useCallback((text: string) => send(text, locale), [send, locale]);

  const toggleVoice = useCallback(() => {
    if (status === AssistantStatus.Idle) {
      void startVoice(locale);
      return;
    }
    void stopVoice();
  }, [status, startVoice, stopVoice, locale]);

  return {
    status,
    isPanelOpen,
    transcript,
    remainingSeconds,
    deniedReason,
    openPanel,
    closePanel,
    toggleVoice,
    sendText,
  };
};
