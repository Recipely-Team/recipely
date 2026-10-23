/**
 * What marking one notification read re-renders.
 *
 * The rows are memoised, but the screen mapped every entity to a fresh row item
 * on each store change, so marking one row read handed every row new props.
 *
 * Measured with React's `<Profiler>` against the real notifications store: a
 * page of notifications loads, one is marked read, and the test counts rows.
 */

/* eslint-disable import/first -- jest.mock() must be hoisted above imports */

const mockRows = { renders: 0 };

jest.mock('@presentation/app/notifications/items/notif-row', () => {
  const actual = jest.requireActual('@presentation/app/notifications/items/notif-row');
  const { memo } = jest.requireActual<typeof import('react')>('react');
  const inner = actual.NotifRow.type;
  const counted = (props: object) => {
    mockRows.renders += 1;
    return inner(props);
  };
  return { ...actual, NotifRow: memo(counted, actual.NotifRow.compare) };
});
jest.mock('@presentation/app/notifications/hooks/use-inbox-actions', () => ({
  useInboxActions: () => ({ isRefreshing: false, refresh: jest.fn(), markAll: jest.fn() }),
}));
// Stable, as the real hook's useCallback is: a fresh function per call would defeat the row memo.
const mockOpenTarget = (): void => undefined;
jest.mock('@presentation/app/notifications/hooks/use-open-notification-target', () => ({
  useOpenNotificationTarget: () => mockOpenTarget,
}));
jest.mock('@presentation/app/notifications/hooks/use-assistant-notification-actions', () => ({
  useAssistantNotificationActions: () => undefined,
}));
jest.mock('@presentation/base/hooks/navigation/use-go-back-or-home', () => ({ useGoBackOrHome: () => jest.fn() }));

import { Profiler } from 'react';
import { act } from 'react-test-renderer';
import { NotificationsScreen } from '@presentation/app/notifications';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { configureNotificationsStore } from '@application/notifications/notifications-store';
import type { ListNotificationsUseCase } from '@application/notifications/list/list-notifications-use-case';
import type { CountUnreadNotificationsUseCase } from '@application/notifications/list/count-unread-notifications-use-case';
import type { MarkAllReadUseCase } from '@application/notifications/read/mark-all-read-use-case';
import type { MarkOneReadUseCase } from '@application/notifications/read/mark-one-read-use-case';
import type { ApplicationStores } from '@application/di/application-stores';
import { ok } from '@core/result/result-helpers';
import { NotificationEntity } from '@domain/notifications/notification-entity';

const COUNT = 15;

const notification = (at: number): NotificationEntity => {
  const result = NotificationEntity.create({
    id: `n${at}`,
    type: 'like',
    senderId: 'sender-1',
    senderDisplayName: 'Buse',
    senderPhotoUrl: null,
    recipeId: 'recipe-1',
    recipeTitle: 'Panna Cotta',
    commentId: null,
    draftId: null,
    message: null,
    sourcePlatform: null,
    sourceHandle: null,
    read: false,
    createdAt: new Date(Date.now() - at * 3_600_000),
  });
  if (!result.ok) throw new Error('fixture construction failed');
  return result.value;
};

it('marking one notification read re-renders that row only', async () => {
  const items = Array.from({ length: COUNT }, (_, at) => notification(at));
  const listed = ok({ page: { items, total: COUNT, page: 1, pageSize: 20, hasMore: false }, unreadCount: COUNT });
  const notificationsStore = configureNotificationsStore({
    listNotifications: { execute: () => Promise.resolve(listed) } as unknown as ListNotificationsUseCase,
    countUnread: { execute: () => Promise.resolve(ok(COUNT)) } as unknown as CountUnreadNotificationsUseCase,
    markAllRead: { execute: () => Promise.resolve(ok(undefined)) } as unknown as MarkAllReadUseCase,
    markOneRead: { execute: () => Promise.resolve(ok(undefined)) } as unknown as MarkOneReadUseCase,
  });

  let duration = 0;
  let measuring = false;
  renderComponent(
    <Profiler id="notifications" onRender={(_id, _phase, actual) => { if (measuring) duration += actual; }}>
      <NotificationsScreen />
    </Profiler>,
    { notificationsStore } as unknown as Partial<ApplicationStores>,
  );
  await act(async () => undefined);
  const mounted = mockRows.renders;

  mockRows.renders = 0;
  measuring = true;
  await act(async () => {
    await notificationsStore.getState().markOneRead('n2');
  });
  measuring = false;

  if (process.env['PROFILE_RENDERS'] === '1') {
    process.stdout.write(`[profile] notifications, ${mounted} rows mounted, mark one read: rows=${mockRows.renders} actualDuration=${duration.toFixed(1)}ms\n`);
  }
  expect(mounted).toBeGreaterThan(1);
  expect(mockRows.renders).toBe(1);
});
