import { useCallback } from 'react';
import { AssistantAction } from '@domain/assistant/actions/assistant-action-type';
import type { AssistantActionResultType } from '@domain/assistant/actions/assistant-action-result';
import { useAssistantAction } from '@presentation/base/hooks/assistant/actions/use-assistant-action';
import { ValueConstants } from '@core/constants';

/** What the notifications screen lends the assistant. */
interface AssistantNotificationActionsDeps {
  unreadCount: number;
  onMarkAllRead: () => void;
  onReload: () => void;
}

/**
 * Notifications, by voice.
 *
 * Marking an already-empty list read answers success without a request: the
 * user asked for an outcome, the outcome holds, and a needless round trip
 * would blank the list while it reloaded.
 */
export const useAssistantNotificationActions = (deps: AssistantNotificationActionsDeps): void => {
  const { unreadCount, onMarkAllRead, onReload } = deps;

  useAssistantAction(
    AssistantAction.MarkAllRead,
    useCallback(async (): Promise<AssistantActionResultType> => {
      if (unreadCount === ValueConstants.zero) return { ok: true, n: { unread: ValueConstants.zero } };
      onMarkAllRead();
      return { ok: true, n: { unread: ValueConstants.zero } };
    }, [unreadCount, onMarkAllRead]),
  );

  useAssistantAction(
    AssistantAction.Refresh,
    useCallback(async (): Promise<AssistantActionResultType> => {
      onReload();
      return { ok: true };
    }, [onReload]),
  );
};
