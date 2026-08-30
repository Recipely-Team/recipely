import { useCallback } from 'react';
import { AssistantAction } from '@domain/assistant/actions/assistant-action-type';
import { AssistantActionError } from '@domain/assistant/actions/assistant-action-error';
import type { AssistantActionResultType } from '@domain/assistant/actions/assistant-action-result';
import type { NotifItem } from '@presentation/app/notifications/model/notif-item';
import { useAssistantAction } from '@presentation/base/hooks/assistant/actions/use-assistant-action';
import { useAssistantScreenContent } from '@presentation/base/hooks/assistant/use-assistant-screen-content';
import { useAssistantScreenReading } from '@presentation/base/hooks/assistant/use-assistant-screen-reading';
import { listReading } from '@presentation/base/hooks/assistant/args/describing/list-reading';
import { recipeRoster } from '@presentation/base/hooks/assistant/args/describing/recipe-roster';
import { SCREEN_PART_SEPARATOR } from '@presentation/base/hooks/assistant/args/describing/screen-line';
import { rowAt } from '@presentation/base/hooks/assistant/args/resolving/row-at';
import { ValueConstants } from '@core/constants';

/** What the notifications screen lends the assistant. */
interface AssistantNotificationActionsDeps {
  unreadCount: number;
  /** The rows as rendered, in the order the user sees them — sections flattened. */
  items: readonly NotifItem[];
  onMarkAllRead: () => void;
  onMarkOneRead: (id: string) => void;
  onReload: () => void;
}

/** What the screen line calls the list. */
const ROSTER_LABEL = 'notifications';
/** Between the two halves of a row's name: who it is from, and what about. */
const ROW_SEPARATOR = ' - ';

/**
 * Notifications, by voice.
 *
 * @remarks
 * - **One row, not only the whole list.** `markAllRead` was the only word this
 *   screen answered, so "bu bildirimi okundu yap" got "I can only mark them
 *   all read" — an assistant refusing the smaller, safer half of what it could
 *   already do. `markRead` resolves the row the way every other list does:
 *   by position or by what the user called it.
 * - **The rows are described, or nothing can be picked.** The model was told
 *   the route and not what was on it, so "the second one" had no referent
 *   here; the screen line now carries the rows and the unread count.
 * - **Marking an already-empty list read answers success without a request**:
 *   the user asked for an outcome, the outcome holds, and a needless round
 *   trip would blank the list while it reloaded.
 */
export const useAssistantNotificationActions = (deps: AssistantNotificationActionsDeps): void => {
  const { unreadCount, items, onMarkAllRead, onMarkOneRead, onReload } = deps;

  useAssistantScreenContent(() =>
    [recipeRoster(ROSTER_LABEL, items.map(rowName)), `unread=${unreadCount}`].join(
      SCREEN_PART_SEPARATOR,
    ),
  );

  // Every row, for `readScreen` — the one screen where "read them to me" is
  // the whole point of the screen and the eight-row line was never going to be
  // the answer.
  useAssistantScreenReading(() =>
    [listReading(ROSTER_LABEL, items.map(rowName)), `unread=${unreadCount}`].join(
      SCREEN_PART_SEPARATOR,
    ),
  );

  useAssistantAction(
    AssistantAction.MarkAllRead,
    useCallback(async (): Promise<AssistantActionResultType> => {
      // Zero unread and zero loaded look identical from here. Before the list
      // arrives every count is zero, so "hepsini okundu yap" reported success
      // over notifications it had never seen.
      if (items.length === ValueConstants.zero && unreadCount === ValueConstants.zero) {
        return { ok: false, error: AssistantActionError.NotReady };
      }
      if (unreadCount === ValueConstants.zero) return { ok: true, n: { unread: ValueConstants.zero } };
      onMarkAllRead();
      return { ok: true, n: { unread: ValueConstants.zero } };
    }, [items, unreadCount, onMarkAllRead]),
  );

  useAssistantAction(
    AssistantAction.MarkRead,
    useCallback(
      async (arg?: string): Promise<AssistantActionResultType> => {
        const at = rowAt(items.map(rowName), arg);
        if (at === null) return { ok: false, error: 'not_found' };

        const item = items[at];
        // Already read is the outcome asked for, not a failure — and the tap
        // path skips the request for the same reason.
        if (item.read) return { ok: true, title: rowName(item) };

        onMarkOneRead(item.id);
        return { ok: true, title: rowName(item) };
      },
      [items, onMarkOneRead],
    ),
  );

  useAssistantAction(
    AssistantAction.Refresh,
    useCallback(async (): Promise<AssistantActionResultType> => {
      onReload();
      return { ok: true };
    }, [onReload]),
  );
};

/**
 * What one row is called out loud: who it is from, and what it is about.
 *
 * The recipe name is half of how a person refers to these ("the comment on the
 * baklava"), and it is what `rowAt` matches on — a row named only by its
 * sender could not be picked out of three notifications from the same person.
 */
function rowName(item: NotifItem): string {
  return item.recipeName === undefined
    ? item.actor
    : `${item.actor}${ROW_SEPARATOR}${item.recipeName}`;
}
