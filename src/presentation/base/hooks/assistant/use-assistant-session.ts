import { useCallback } from 'react';
import { useStore } from 'zustand';
import type { Failure } from '@core/failure';
import type { AssistantDenialReasonType } from '@domain/assistant/session/assistant-denial-reason';
import { AssistantStatus, type AssistantStatusType } from '@application/assistant/session/assistant-status';
import { assistantIsLive } from '@application/assistant/session/assistant-is-live';
import type { AssistantTranscriptLineType } from '@application/assistant/session/assistant-transcript-line';
import type { AssistantViewType } from '@application/assistant/session/assistant-view';
import { useLocale } from '@presentation/i18n/use-locale';
import { useStores } from '@presentation/bootstrap/use-stores';

interface AssistantSessionView {
  status: AssistantStatusType;
  view: AssistantViewType;
  isMuted: boolean;
  transcript: AssistantTranscriptLineType[];
  remainingSeconds: number;
  /** True for an account the server does not meter — `remainingSeconds` is
   *  then a floor, not a balance, and never runs out. */
  isUnlimited: boolean;
  deniedReason: AssistantDenialReasonType | null;
  /** A failure the user has to be told about — a request that did not land. */
  error: Failure | null;
  clearError: () => void;
  setView: (view: AssistantViewType) => void;
  toggleMute: () => void;
  toggleVoice: () => void;
  sendText: (text: string) => void;
}

/**
 * The assistant, as a screen sees it.
 *
 * @remarks
 * - **One toggle, not start and stop.** The controls are single targets, and a
 *   caller deciding which of two calls to make would be re-deriving state the
 *   store already holds — and getting it wrong while connecting.
 * - **The language comes from the app's locale**, not from the device's, so the
 *   assistant answers in the language the user chose to read the app in. It is
 *   fixed at mint time, which is why it is read here and not later.
 */
export const useAssistantSession = (): AssistantSessionView => {
  const { assistantSessionStore } = useStores();
  const locale = useLocale();

  const status = useStore(assistantSessionStore, (s) => s.session.status);
  const view = useStore(assistantSessionStore, (s) => s.view);
  const isMuted = useStore(assistantSessionStore, (s) => s.isMuted);
  const transcript = useStore(assistantSessionStore, (s) => s.transcript);
  const remainingSeconds = useStore(assistantSessionStore, (s) => s.remainingSeconds);
  const isUnlimited = useStore(assistantSessionStore, (s) => s.isUnlimited);
  const deniedReason = useStore(assistantSessionStore, (s) => (s.session.status === AssistantStatus.Unavailable ? s.session.deniedReason : null));
  const error = useStore(assistantSessionStore, (s) => s.error);
  const clearError = useStore(assistantSessionStore, (s) => s.clearError);
  const setView = useStore(assistantSessionStore, (s) => s.setView);
  const toggleMute = useStore(assistantSessionStore, (s) => s.toggleMute);
  const startVoice = useStore(assistantSessionStore, (s) => s.startVoice);
  const stopVoice = useStore(assistantSessionStore, (s) => s.stopVoice);
  const send = useStore(assistantSessionStore, (s) => s.sendText);
  const sendText = useCallback((text: string) => send(text, locale), [send, locale]);

  const toggleVoice = useCallback(() => {
    // Not live (Unavailable included) starts a session.
    if (!assistantIsLive(status)) {
      void startVoice(locale);
      return;
    }
    void stopVoice();
  }, [status, startVoice, stopVoice, locale]);

  return {
    status,
    view,
    isMuted,
    transcript,
    remainingSeconds,
    isUnlimited,
    deniedReason,
    error,
    clearError,
    setView,
    toggleMute,
    toggleVoice,
    sendText,
  };
};
