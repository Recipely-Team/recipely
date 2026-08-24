import { act } from 'react-test-renderer';
import { AssistantAction } from '@domain/assistant/actions/assistant-action-type';
import { AssistantActionRegistry } from '@application/assistant/actions/assistant-action-registry';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { StoresProvider } from '@presentation/bootstrap/stores-context';
import type { Stores } from '@presentation/bootstrap/stores';
import type { NotifItem } from '@presentation/app/notifications/model/notif-item';
import { useAssistantNotificationActions } from '@presentation/app/notifications/hooks/use-assistant-notification-actions';

/**
 * "Bu bildirimi okundu yap" was answered with "I can only mark them all read":
 * `markAllRead` was the only word this screen registered, so the assistant
 * refused the smaller and safer half of what it could already do — and the
 * model had no idea what was on the list either, because the screen described
 * nothing.
 */

const ITEMS: NotifItem[] = [
  { id: 'n1', kind: 'comment', actor: 'Ayşe', recipeName: 'Baklava', daysAgo: 0, read: false, target: null },
  { id: 'n2', kind: 'like', actor: 'Mehmet', recipeName: 'Mercimek çorbası', daysAgo: 1, read: false, target: null },
  { id: 'n3', kind: 'follow', actor: 'Zeynep', daysAgo: 2, read: true, target: null },
];

function harness(items: NotifItem[] = ITEMS, unreadCount = 2) {
  const registry = new AssistantActionRegistry();
  const spies = {
    onMarkAllRead: jest.fn(),
    onMarkOneRead: jest.fn(),
    onReload: jest.fn(),
  };

  const Probe = (): null => {
    useAssistantNotificationActions({ unreadCount, items, ...spies });
    return null;
  };

  renderComponent(
    <StoresProvider value={{ assistantActionRegistry: registry } as unknown as Stores}>
      <Probe />
    </StoresProvider>,
  );

  return { registry, spies };
}

describe('useAssistantNotificationActions', () => {
  afterEach(async () => {
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
  });

  it('marks the row the user pointed at, by position', async () => {
    const { registry, spies } = harness();

    await act(async () => {
      await expect(registry.run(AssistantAction.MarkRead, '2')).resolves.toMatchObject({ ok: true });
    });

    expect(spies.onMarkOneRead).toHaveBeenCalledWith('n2');
    expect(spies.onMarkAllRead).not.toHaveBeenCalled();
  });

  // A person says "the comment on the baklava", not "notification n1".
  it('marks it by what the user called it', async () => {
    const { registry, spies } = harness();

    await act(async () => {
      await registry.run(AssistantAction.MarkRead, 'baklava');
    });

    expect(spies.onMarkOneRead).toHaveBeenCalledWith('n1');
  });

  it('says so rather than guessing when nothing matches', async () => {
    const { registry, spies } = harness();

    await act(async () => {
      await expect(registry.run(AssistantAction.MarkRead, 'karnıyarık')).resolves.toMatchObject({
        ok: false,
        error: 'not_found',
      });
    });

    expect(spies.onMarkOneRead).not.toHaveBeenCalled();
  });

  // Already read is the outcome that was asked for; the tap path skips the
  // request for the same reason.
  it('does not re-mark a row that is already read', async () => {
    const { registry, spies } = harness();

    await act(async () => {
      await expect(registry.run(AssistantAction.MarkRead, '3')).resolves.toMatchObject({ ok: true });
    });

    expect(spies.onMarkOneRead).not.toHaveBeenCalled();
  });

  it('describes the list, so a row can be picked at all', async () => {
    const { registry } = harness();

    await act(async () => {
      const result = await registry.run(AssistantAction.MarkRead, '1');
      expect(result.ctx).toContain('notifications=1) Ayşe - Baklava');
      expect(result.ctx).toContain('unread=2');
    });
  });

  it('still marks the whole list read', async () => {
    const { registry, spies } = harness();

    await act(async () => {
      await registry.run(AssistantAction.MarkAllRead);
    });

    expect(spies.onMarkAllRead).toHaveBeenCalled();
  });
});
