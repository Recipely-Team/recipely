import { toCreatorPage } from '@infrastructure/creators/to-creator-page';
import type { CreatorSummaryDto } from '@infrastructure/creators/dtos/creator-summary-dto';
import type { PageDto } from '@infrastructure/network/paging/page-dto';

const item = (id: string, overrides: Partial<CreatorSummaryDto> = {}): CreatorSummaryDto => ({
  id,
  displayName: `Creator ${id}`,
  photoUrl: null,
  creatorTags: [{ platform: 'instagram', handle: `chef_${id}` }],
  recipeCount: 3,
  followerCount: 40,
  ...overrides,
});

const page = (items: CreatorSummaryDto[], overrides: Partial<PageDto<CreatorSummaryDto>> = {}): PageDto<CreatorSummaryDto> => ({
  items,
  total: items.length,
  page: 1,
  pageSize: 20,
  ...overrides,
});

describe('toCreatorPage', () => {
  it('maps every item and carries the envelope through', () => {
    const r = toCreatorPage(page([item('1'), item('2')], { total: 45, page: 2 }));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.items.map((c) => c.id)).toEqual(['1', '2']);
    expect(r.value.items[0].creatorTags[0]?.displayHandle).toBe('@chef_1');
    expect(r.value.items[0].followerCount).toBe(40);
    expect(r.value.total).toBe(45);
    expect(r.value.page).toBe(2);
    expect(r.value.pageSize).toBe(20);
  });

  it('says there is more while page * pageSize is under total', () => {
    const more = toCreatorPage(page([item('1')], { total: 21, page: 1, pageSize: 20 }));
    const last = toCreatorPage(page([item('1')], { total: 40, page: 2, pageSize: 20 }));
    expect(more.ok && more.value.hasMore).toBe(true);
    expect(last.ok && last.value.hasMore).toBe(false);
  });

  it('skips an item it cannot read instead of emptying the grid', () => {
    const r = toCreatorPage(
      page([item('1'), item('2', { creatorTags: [{ platform: 'youtube', handle: 'x' }] }), item('3', { displayName: '' })]),
    );
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.items.map((c) => c.id)).toEqual(['1']);
  });

  it('keeps both accounts of a two-platform creator, Instagram first', () => {
    const r = toCreatorPage(
      page([
        item('1', {
          creatorTags: [
            { platform: 'tiktok', handle: 'mert.mutfakta' },
            { platform: 'instagram', handle: 'mertmutfakta' },
          ],
        }),
      ]),
    );
    expect(r.ok && r.value.items[0]?.creatorTags.map((tag) => tag.displayHandle)).toEqual(['@mertmutfakta', '@mert.mutfakta']);
  });
});
