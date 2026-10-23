import { NotificationEntity } from '@domain/notifications/notification-entity';
import { toCachedNotifItem } from '@presentation/app/notifications/model/to-cached-notif-item';

/**
 * The inbox rows are memoised on their item, so the item must keep its
 * identity for an untouched notification — and must not keep a "days ago"
 * that stopped being true.
 */
const NOW = new Date('2026-10-23T12:00:00Z');
const DAY_MS = 86_400_000;

const notification = (id: string, createdAt: Date): NotificationEntity => {
  const created = NotificationEntity.create({
    id,
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
    createdAt,
  });
  if (!created.ok) throw new Error('fixture notification invalid');
  return created.value;
};

beforeEach(() => jest.useFakeTimers({ now: NOW }));
afterEach(() => jest.useRealTimers());

it('returns the same item for the same notification', () => {
  const entity = notification('n1', new Date(NOW.getTime() - DAY_MS));

  expect(toCachedNotifItem(entity)).toBe(toCachedNotifItem(entity));
});

it('makes a new item for a new notification object, even with the same id', () => {
  const createdAt = new Date(NOW.getTime() - DAY_MS);

  expect(toCachedNotifItem(notification('n1', createdAt))).not.toBe(toCachedNotifItem(notification('n1', createdAt)));
});

it('re-makes the item once its day has ticked over, so "1 day ago" becomes "2 days ago"', () => {
  const entity = notification('n1', new Date(NOW.getTime() - DAY_MS));
  const yesterday = toCachedNotifItem(entity);

  jest.setSystemTime(new Date(NOW.getTime() + DAY_MS));
  const today = toCachedNotifItem(entity);

  expect(yesterday.daysAgo).toBe(1);
  expect(today.daysAgo).toBe(2);
  expect(today).not.toBe(yesterday);
});
