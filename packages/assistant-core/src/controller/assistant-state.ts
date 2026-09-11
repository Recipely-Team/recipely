import type { TranscriptEntry } from '../conversation/transcript-entry';
import type { AssistantFailure } from '../result/failure';
import type { AssistantStatusType } from './assistant-status';
import type { EndReasonType } from './end-reason';

/**
 * Everything about a session that changes a few times a turn — the part a UI
 * re-renders on. Levels are deliberately NOT here: they change every frame and
 * are read from `controller.inputLevel` / `outputLevel` instead.
 *
 * A new object on every change (never mutated), so `useSyncExternalStore` and
 * selector-based stores can compare by reference.
 */
export interface AssistantState {
  readonly status: AssistantStatusType;
  readonly transcript: readonly TranscriptEntry[];
  readonly isMuted: boolean;
  /** The last failure, cleared when the next session starts. `no_answer` clears itself when anything arrives. */
  readonly error: AssistantFailure | null;
  readonly endReason: EndReasonType | null;
  /** Tokens the provider reports for the session so far. */
  readonly tokensUsed: number;
}
