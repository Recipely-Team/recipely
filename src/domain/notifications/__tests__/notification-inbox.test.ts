import { NotificationEntity } from '@domain/notifications/notification-entity';
import { NotificationInbox } from '@domain/notifications/notification-inbox';

const make = (id: string, read: boolean): NotificationEntity => {
  const result = NotificationEntity.create({
    id,
    type: 'like',
    senderId: null,
    senderDisplayName: null,
    senderPhotoUrl: null,
    recipeId: 'recipe-1',
    recipeTitle: null,
    commentId: null,
    draftId: null,
    message: null,
    sourcePlatform: null,
    sourceHandle: null,
    read,
    createdAt: new Date('2026-06-01T12:00:00.000Z'),
  });
  if (!result.ok) throw new Error('Test setup expected a valid Notification');
  return result.value;
};

describe('NotificationInbox.markRead', () => {
  it('flips only that row and takes one off the badge', () => {
    const next = NotificationInbox.of([make('n1', false), make('n2', false)], 5).markRead('n1');

    expect(next.items.map((n) => n.read)).toEqual([true, false]);
    expect(next.unreadCount).toBe(4);
  });

  it('never takes the badge below zero', () => {
    expect(NotificationInbox.of([make('n1', false)], 0).markRead('n1').unreadCount).toBe(0);
  });

  it('returns the same inbox for an already-read or unknown row', () => {
    const inbox = NotificationInbox.of([make('n1', true)], 2);

    expect(inbox.markRead('n1')).toBe(inbox);
    expect(inbox.markRead('missing')).toBe(inbox);
  });
});

describe('NotificationInbox.markAllRead', () => {
  it('reads every row and clears the badge, even past the loaded page', () => {
    const next = NotificationInbox.of([make('n1', false)], 9).markAllRead();

    expect(next.items.every((n) => n.read)).toBe(true);
    expect(next.unreadCount).toBe(0);
  });

  it('clears the badge with no rows loaded', () => {
    expect(NotificationInbox.of([], 3).markAllRead().unreadCount).toBe(0);
  });

  it('returns the same inbox when nothing is unread', () => {
    const inbox = NotificationInbox.of([make('n1', true)], 0);

    expect(inbox.markAllRead()).toBe(inbox);
  });
});
