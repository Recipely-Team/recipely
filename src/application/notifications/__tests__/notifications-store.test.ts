import { configureNotificationsStore } from '@application/notifications/configure-notifications-store';
import type { ListNotificationsUseCase } from '@application/notifications/list/list-notifications-use-case';
import type { ListNotificationsResult } from '@application/notifications/list/list-notifications-result';
import type { MarkAllReadUseCase } from '@application/notifications/read/mark-all-read-use-case';
import type { MarkOneReadUseCase } from '@application/notifications/read/mark-one-read-use-case';
import { NetworkFailure, type Failure } from '@core/failure';
import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import { NotificationEntity } from '@domain/notifications/notification-entity';

const makeNotification = (id: string, read: boolean): NotificationEntity => {
  const result = NotificationEntity.create({
    id,
    type: 'like',
    senderId: 'sender-1',
    senderDisplayName: 'Buse',
    senderPhotoUrl: null,
    recipeId: 'recipe-1',
    recipeTitle: 'Panna Cotta',
    commentId: null,
    message: null,
    read,
    createdAt: new Date('2026-06-01T12:00:00.000Z'),
  });
  if (!result.ok) throw new Error('Test setup expected a valid Notification');
  return result.value;
};

interface StubConfig {
  listResults?: Result<ListNotificationsResult, Failure>[];
  markResult?: Result<void, Failure>;
  markOneResult?: Result<void, Failure>;
}

const makeStore = (config: StubConfig) => {
  const listResults = config.listResults ?? [];
  const listInputs: { limit?: number; offset?: number }[] = [];
  let listIndex = 0;
  let markCalls = 0;
  const markOneIds: string[] = [];

  const listNotifications = {
    execute: (input: { limit?: number; offset?: number } = {}) => {
      listInputs.push(input);
      const result = listResults[Math.min(listIndex, listResults.length - 1)];
      listIndex += 1;
      return Promise.resolve(result ?? fail(new NetworkFailure('not configured')));
    },
  } as unknown as ListNotificationsUseCase;

  const markAllRead = {
    execute: () => {
      markCalls += 1;
      return Promise.resolve(config.markResult ?? ok(undefined));
    },
  } as unknown as MarkAllReadUseCase;

  const markOneRead = {
    execute: (id: string) => {
      markOneIds.push(id);
      return Promise.resolve(config.markOneResult ?? ok(undefined));
    },
  } as unknown as MarkOneReadUseCase;

  const store = configureNotificationsStore({ listNotifications, markAllRead, markOneRead });
  return { store, listInputs, markCallCount: () => markCalls, markOneIds };
};

const loaded = (items: NotificationEntity[], unreadCount: number): Result<ListNotificationsResult, Failure> =>
  ok({ items, total: items.length, unreadCount });

describe('notifications store — load', () => {
  it('sets the top-level unreadCount alongside the loaded state', async () => {
    const { store } = makeStore({ listResults: [loaded([makeNotification('n1', false)], 3)] });

    await store.getState().load();

    expect(store.getState().unreadCount).toBe(3);
    expect(store.getState().state.status).toBe('loaded');
  });
});

describe('notifications store — refreshUnread', () => {
  it('updates only the unreadCount and leaves the feed untouched', async () => {
    const { store, listInputs } = makeStore({ listResults: [loaded([], 7)] });

    await store.getState().refreshUnread();

    expect(store.getState().unreadCount).toBe(7);
    // Feed was never loaded, so it must remain idle.
    expect(store.getState().state.status).toBe('idle');
    // Should request the minimum page.
    expect(listInputs[0]).toEqual({ limit: 1 });
  });

  it('keeps the previous count when the refresh request fails', async () => {
    const { store } = makeStore({
      listResults: [loaded([], 4), fail(new NetworkFailure('offline'))],
    });

    await store.getState().refreshUnread();
    await store.getState().refreshUnread();

    expect(store.getState().unreadCount).toBe(4);
  });
});

describe('notifications store — markAllRead', () => {
  it('clears the badge and flips loaded items to read', async () => {
    const { store, markCallCount } = makeStore({
      listResults: [loaded([makeNotification('n1', false), makeNotification('n2', false)], 2)],
    });

    await store.getState().load();
    await store.getState().markAllRead();

    expect(store.getState().unreadCount).toBe(0);
    expect(markCallCount()).toBe(1);
    const state = store.getState().state;
    expect(state.status === 'loaded' && state.items.every((n) => n.read)).toBe(true);
  });

  it('still clears the badge when the list has not been loaded', async () => {
    const { store, markCallCount } = makeStore({ markResult: ok(undefined) });
    // Seed a stale count without loading the feed.
    store.setState({ unreadCount: 5 });

    await store.getState().markAllRead();

    expect(store.getState().unreadCount).toBe(0);
    expect(markCallCount()).toBe(1);
  });
});

describe('notifications store — markOneRead', () => {
  it('flips only the tapped item to read and decrements both unread counts', async () => {
    const { store, markOneIds } = makeStore({
      listResults: [loaded([makeNotification('n1', false), makeNotification('n2', false)], 2)],
    });

    await store.getState().load();
    await store.getState().markOneRead('n1');

    expect(markOneIds).toEqual(['n1']);
    expect(store.getState().unreadCount).toBe(1);
    const state = store.getState().state;
    if (state.status !== 'loaded') throw new Error('expected loaded state');
    expect(state.unreadCount).toBe(1);
    expect(state.items.find((n) => n.id === 'n1')?.read).toBe(true);
    expect(state.items.find((n) => n.id === 'n2')?.read).toBe(false);
  });

  it('is a no-op for an already-read item', async () => {
    const { store, markOneIds } = makeStore({
      listResults: [loaded([makeNotification('n1', true)], 0)],
    });

    await store.getState().load();
    await store.getState().markOneRead('n1');

    expect(markOneIds).toEqual([]);
    expect(store.getState().unreadCount).toBe(0);
  });

  it('reloads the feed when the backend rejects the mark', async () => {
    const { store, listInputs } = makeStore({
      listResults: [loaded([makeNotification('n1', false)], 1)],
      markOneResult: fail(new NetworkFailure('offline')),
    });

    await store.getState().load();
    await store.getState().markOneRead('n1');

    // load (1) + reload after failure (1) — the source of truth wins.
    expect(listInputs).toHaveLength(2);
    const state = store.getState().state;
    if (state.status !== 'loaded') throw new Error('expected loaded state');
    expect(state.items[0]?.read).toBe(false);
    expect(store.getState().unreadCount).toBe(1);
  });
});
