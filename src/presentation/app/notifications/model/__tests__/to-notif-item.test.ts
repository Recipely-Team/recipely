import { NotificationEntity } from '@domain/notifications/notification-entity';
import type { NotificationEntityProps } from '@domain/notifications/notification-entity-props';
import { toNotifItem } from '@presentation/app/notifications/model/to-notif-item';
import { NotifKind } from '@presentation/app/notifications/model/notif-kind';

/**
 * A failed import read "Your imported recipe is ready" in the inbox. The
 * server records a failure as `import_done` with no draft and no recipe (seen
 * live on dev after a Facebook reel and a too-long TikTok failed), and the row
 * took the type at its word — then went nowhere when tapped.
 */
const importRow = (overrides: Partial<NotificationEntityProps>): NotificationEntity => {
  const created = NotificationEntity.create({
    id: 'n1',
    type: 'import_done',
    senderId: null,
    senderDisplayName: null,
    senderPhotoUrl: null,
    recipeId: null,
    recipeTitle: null,
    commentId: null,
    draftId: null,
    message: null,
    sourcePlatform: null,
    sourceHandle: null,
    read: false,
    createdAt: new Date(),
    ...overrides,
  });
  if (!created.ok) throw new Error('fixture notification invalid');
  return created.value;
};

describe('toNotifItem', () => {
  it('reads an import with no draft and no recipe as a failed import, not a ready one', () => {
    const item = toNotifItem(importRow({}));

    expect(item.kind).toBe(NotifKind.ImportFailed);
  });

  it('keeps an import that produced a draft as done', () => {
    const item = toNotifItem(importRow({ draftId: 'draft-1', message: 'Trileçe' }));

    expect(item.kind).toBe(NotifKind.ImportDone);
  });

  it('keeps an import whose draft was published as done', () => {
    const item = toNotifItem(importRow({ recipeId: 'recipe-1' }));

    expect(item.kind).toBe(NotifKind.ImportDone);
  });
});

describe('toNotifItem — import provenance', () => {
  it('carries the platform and account the server stored', () => {
    const item = toNotifItem(importRow({ draftId: 'd1', sourcePlatform: 'TIKTOK', sourceHandle: 'chef.ayse' }));

    expect(item.source).toEqual({ platform: 'TIKTOK', handle: 'chef.ayse' });
  });

  it('carries the platform alone when no account was stored', () => {
    expect(toNotifItem(importRow({ sourcePlatform: 'YOUTUBE' })).source).toEqual({ platform: 'YOUTUBE' });
  });

  it('carries no source for a row the server wrote before it stored one', () => {
    expect(toNotifItem(importRow({ draftId: 'd1' })).source).toBeUndefined();
  });
});

describe('toNotifItem — creator decisions', () => {
  it.each([
    ['creator_approved', NotifKind.CreatorApproved],
    ['creator_rejected', NotifKind.CreatorRejected],
  ])('draws %s as its own kind, naming the account', (type, kind) => {
    const item = toNotifItem(importRow({ type, creatorPlatform: 'tiktok', sourceHandle: 'mert.mutfakta' }));

    expect(item.kind).toBe(kind);
    expect(item.creator).toEqual({ platform: 'tiktok', handle: 'mert.mutfakta' });
    expect(item.source).toBeUndefined();
    expect(item.target).toEqual({ kind: 'creator_account', platform: 'tiktok' });
  });
});
