import { ok } from '@core/result/result-helpers';
import type { HttpClient } from '@infrastructure/network/http/http-client';
import { NotificationRepository } from '@infrastructure/notifications/notification-repository';
import type { NotificationItemDto } from '@infrastructure/notifications/dtos/notification-item-dto';

/**
 * The list endpoint now says where an import notification's recipe came from.
 * Without it the inbox drew the Instagram logo on every import row.
 */
const dto = (overrides: Partial<NotificationItemDto> = {}): NotificationItemDto => ({
  id: 'n1',
  type: 'import_done',
  senderId: null,
  senderDisplayName: null,
  senderPhotoUrl: null,
  recipeId: null,
  recipeTitle: null,
  draftId: 'd1',
  message: 'Menemen',
  read: false,
  createdAt: '2026-09-28T12:00:00Z',
  ...overrides,
});

const listOf = async (item: NotificationItemDto) => {
  const http = { get: jest.fn().mockResolvedValue(ok({ items: [item], total: 1, unreadCount: 1 })) };
  const result = await new NotificationRepository(http as unknown as HttpClient).list(1, 20);
  if (!result.ok) throw new Error('list failed');
  const [first] = result.value.page.items;
  if (first === undefined) throw new Error('no item');
  return first;
};

describe('NotificationRepository.list — import provenance', () => {
  it('maps the platform and account from the wire', async () => {
    const n = await listOf(dto({ sourcePlatform: 'TIKTOK', sourceHandle: 'chef.ayse' }));

    expect(n.sourcePlatform).toBe('TIKTOK');
    expect(n.sourceHandle).toBe('chef.ayse');
  });

  it('reads a server that omits the fields as no platform', async () => {
    const n = await listOf(dto());

    expect(n.sourcePlatform).toBeNull();
    expect(n.sourceHandle).toBeNull();
  });

  it('drops a platform this build has no word for rather than guessing', async () => {
    const n = await listOf(dto({ sourcePlatform: 'PINTEREST', sourceHandle: '' }));

    expect(n.sourcePlatform).toBeNull();
    expect(n.sourceHandle).toBeNull();
  });
});

// A creator decision names a lower-case creator platform where an import names
// an upper-case source one; the type decides which reading applies.
describe('NotificationRepository.list — creator decisions', () => {
  it.each(['creator_approved', 'creator_rejected'])('reads %s as a creator platform and handle, not an import source', async (type) => {
    const n = await listOf(dto({ type, sourcePlatform: 'instagram', sourceHandle: 'mertmutfakta', draftId: null }));

    expect(n.creatorPlatform).toBe('instagram');
    expect(n.sourceHandle).toBe('mertmutfakta');
    expect(n.sourcePlatform).toBeNull();
  });

  it('leaves an import\'s upper-case platform as the import source', async () => {
    const n = await listOf(dto({ sourcePlatform: 'INSTAGRAM' }));

    expect(n.sourcePlatform).toBe('INSTAGRAM');
    expect(n.creatorPlatform).toBeNull();
  });
});

describe('NotificationRepository.list — paging', () => {
  it('asks for the requested page as limit/offset and reports whether more remain', async () => {
    const http = { get: jest.fn().mockResolvedValue(ok({ items: [dto()], total: 45, unreadCount: 3 })) };
    const result = await new NotificationRepository(http as unknown as HttpClient).list(2, 20);

    expect(http.get).toHaveBeenCalledWith(expect.any(String), { params: { limit: 20, offset: 20 } });
    if (!result.ok) throw new Error('list failed');
    expect(result.value.page).toMatchObject({ page: 2, pageSize: 20, total: 45, hasMore: true });
    expect(result.value.unreadCount).toBe(3);
  });

  it('says the last page is the last', async () => {
    const http = { get: jest.fn().mockResolvedValue(ok({ items: [dto()], total: 45, unreadCount: 0 })) };
    const result = await new NotificationRepository(http as unknown as HttpClient).list(3, 20);

    expect(http.get).toHaveBeenCalledWith(expect.any(String), { params: { limit: 20, offset: 40 } });
    expect(result.ok && result.value.page.hasMore).toBe(false);
  });
});
