import { AssistantStatus, type AssistantStatusType } from '@application/assistant/session/assistant-status';
import { t } from '@presentation/i18n';

type AssistantCopy = ReturnType<typeof t>['assistant'];

// Only the entries that ARE a line — the namespace also holds the action
// dictionary and the suggestion list, and a status pointing at either of those
// would put an object on screen.
type AssistantCopyKey = {
  [K in keyof AssistantCopy]: AssistantCopy[K] extends string ? K : never;
}[keyof AssistantCopy];

/**
 * The one line the pill shows for each state.
 *
 * A lookup rather than a chain of ternaries inside the component: the status is
 * a closed vocabulary, so a `Record` keyed by it turns a new state into a
 * compile error here instead of a silently blank label on screen.
 *
 * `Unavailable` reuses the idle line on purpose — the pill says "tap to talk"
 * and the panel explains why voice is off. Two places saying it would leave the
 * user reading the same refusal twice.
 */
const LABEL_KEYS: Record<AssistantStatusType, AssistantCopyKey> = {
  [AssistantStatus.Idle]: 'idle',
  [AssistantStatus.Connecting]: 'connecting',
  [AssistantStatus.Listening]: 'listening',
  [AssistantStatus.Speaking]: 'speaking',
  [AssistantStatus.Working]: 'working',
  [AssistantStatus.Unavailable]: 'idle',
};

export function assistantStatusLabel(status: AssistantStatusType): string {
  return t().assistant[LABEL_KEYS[status]];
}
