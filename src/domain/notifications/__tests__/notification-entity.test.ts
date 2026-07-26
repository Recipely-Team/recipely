import { NotificationEntity, type NotificationProps } from '@domain/notifications/notification-entity';

const makeProps = (overrides: Partial<NotificationProps> = {}): NotificationProps => ({
  id: 'n1',
  type: 'like',
  senderId: 'sender-1',
  senderDisplayName: 'Buse',
  senderPhotoUrl: null,
  recipeId: 'recipe-1',
  recipeTitle: 'Panna Cotta',
  commentId: null,
  message: null,
  read: false,
  createdAt: new Date('2026-06-01T12:00:00.000Z'),
  ...overrides,
});

const build = (overrides: Partial<NotificationProps> = {}): NotificationEntity => {
  const result = NotificationEntity.create(makeProps(overrides));
  if (!result.ok) {
    throw new Error('Test setup expected a valid Notification');
  }
  return result.value;
};

describe('NotificationEntity.target', () => {
  it('targets the exact comment when commentId and recipeId are both present', () => {
    const notification = build({
      type: 'comment',
      recipeId: 'recipe-1',
      commentId: 'comment-9',
    });

    expect(notification.target).toEqual({
      kind: 'comment',
      recipeId: 'recipe-1',
      commentId: 'comment-9',
    });
  });

  it('targets the recipe when only recipeId is present', () => {
    const notification = build({ type: 'like', recipeId: 'recipe-1', commentId: null });

    expect(notification.target).toEqual({ kind: 'recipe', recipeId: 'recipe-1' });
  });

  it('has no destination for a follow notification with no recipeId', () => {
    const notification = build({
      type: 'follow',
      recipeId: null,
      recipeTitle: null,
      commentId: null,
    });

    expect(notification.target).toBeNull();
  });
});

describe('NotificationEntity — asRead', () => {
  it('returns a read copy and leaves the original unchanged', () => {
    const unread = build({ read: false });

    const read = unread.asRead();

    expect(read.read).toBe(true);
    expect(read.id).toBe(unread.id);
    expect(unread.read).toBe(false);
  });

  it('returns the same instance when already read', () => {
    const notification = build({ read: true });

    expect(notification.asRead()).toBe(notification);
  });
});
