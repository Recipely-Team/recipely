import { useCallback } from 'react';
import type { Failure } from '@core/failure';
import type { AssistantDenialReasonType } from '@domain/assistant/session/assistant-denial-reason';
import type { AssistantStatusType } from '@application/assistant/session/assistant-status';
import { assistantIsLive } from '@application/assistant/session/assistant-is-live';
import type { AssistantTranscriptLine } from '@application/assistant/session/assistant-transcript-line';
import type { AssistantViewType } from '@application/assistant/session/assistant-view';
import { useLocale } from '@presentation/i18n/use-locale';
import { useStores } from '@presentation/bootstrap/use-stores';

interface AssistantSessionView {
  status: AssistantStatusType;
  view: AssistantViewType;
  /** 0..1, already scaled for a bar — see the store. Scaling it again pins a whisper at the top. */
  level: number;
  isMuted: boolean;
  transcript: AssistantTranscriptLine[];
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

  const status = assistantSessionStore((s) => s.status);
  const view = assistantSessionStore((s) => s.view);
  const level = assistantSessionStore((s) => s.level);
  const isMuted = assistantSessionStore((s) => s.isMuted);
  const transcript = assistantSessionStore((s) => s.transcript);
  const remainingSeconds = assistantSessionStore((s) => s.remainingSeconds);
  const isUnlimited = assistantSessionStore((s) => s.isUnlimited);
  const deniedReason = assistantSessionStore((s) => s.deniedReason);
  const error = assistantSessionStore((s) => s.error);
  const clearError = assistantSessionStore((s) => s.clearError);
  const setView = assistantSessionStore((s) => s.setView);
  const toggleMute = assistantSessionStore((s) => s.toggleMute);
  const startVoice = assistantSessionStore((s) => s.startVoice);
  const stopVoice = assistantSessionStore((s) => s.stopVoice);
  const send = assistantSessionStore((s) => s.sendText);
  const sendText = useCallback((text: string) => send(text, locale), [send, locale]);

  const toggleVoice = useCallback(() => {
    // Asked as "is it idle", this called STOP when the status was Unavailable —
    // so the first press after any failure appeared to do nothing, and the user
    // had to press the same button twice to get a session.
    if (!assistantIsLive(status)) {
      void startVoice(locale);
      return;
    }
    void stopVoice();
  }, [status, startVoice, stopVoice, locale]);

  return {
    status,
    view,
    level,
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
