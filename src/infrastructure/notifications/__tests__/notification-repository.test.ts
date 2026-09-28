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
  const result = await new NotificationRepository(http as unknown as HttpClient).list();
  if (!result.ok) throw new Error('list failed');
  const [first] = result.value.items;
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
