import type { AssistantIdle } from '@application/assistant/session/states/assistant-idle';
import type { AssistantConnecting } from '@application/assistant/session/states/assistant-connecting';
import type { AssistantListening } from '@application/assistant/session/states/assistant-listening';
import type { AssistantThinking } from '@application/assistant/session/states/assistant-thinking';
import type { AssistantSpeaking } from '@application/assistant/session/states/assistant-speaking';
import type { AssistantWorking } from '@application/assistant/session/states/assistant-working';
import type { AssistantUnavailable } from '@application/assistant/session/states/assistant-unavailable';

/**
 * Where the voice session stands. A refusal reason exists only on
 * `AssistantUnavailable`, so "listening, but denied" cannot be represented.
 */
export type AssistantSessionState =
  | AssistantIdle
  | AssistantConnecting
  | AssistantListening
  | AssistantThinking
  | AssistantSpeaking
  | AssistantWorking
  | AssistantUnavailable;
