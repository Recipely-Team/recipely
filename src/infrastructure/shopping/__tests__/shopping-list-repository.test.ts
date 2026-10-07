import { ConflictFailure } from '@core/failure';
import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import type { HttpClient } from '@infrastructure/network/http/http-client';
import { withHttpVerbs } from '@infrastructure/network/http/__fixtures__/with-http-verbs';
import { ShoppingListRepository } from '@infrastructure/shopping/shopping-list-repository';
import type { ShoppingItemDto } from '@infrastructure/shopping/dtos/shopping-item-dto';

interface RequestCall {
  method?: string;
  url?: string;
  params?: unknown;
  data?: unknown;
}

const answering = (answer: Result<unknown, unknown>): { repo: ShoppingListRepository; calls: RequestCall[] } => {
  const calls: RequestCall[] = [];
  const http: HttpClient = withHttpVerbs(
    jest.fn((config: RequestCall) => {
      calls.push(config);
      return Promise.resolve(answer);
    }),
  );
  return { repo: new ShoppingListRepository(http), calls };
};

const line = (over: Partial<ShoppingItemDto> = {}): ShoppingItemDto => ({
  id: 's1',
  label: 'Flour',
  quantity: 2,
  unit: 'cups',
  recipeId: 'r1',
  recipeName: 'Pancakes',
  checked: false,
  position: 0,
  createdAt: '2026-10-01T10:00:00.000Z',
  updatedAt: '2026-10-01T10:00:00.000Z',
  ...over,
});

describe('ShoppingListRepository', () => {
  it('puts the requested page in the query and derives hasMore from the counts', async () => {
    const { repo, calls } = answering(ok({ items: [line(), line({ id: '', label: 'bad' })], total: 45, page: 2, pageSize: 20 }));
    const page = await repo.list(2, 20);
    expect(calls[0]).toMatchObject({ method: 'GET', url: '/me/shopping-list', params: { page: 2, pageSize: 20 } });
    expect(page.ok && [page.value.items.map((i) => i.id), page.value.page, page.value.hasMore]).toEqual([['s1'], 2, true]);
    const last = await answering(ok({ items: [line()], total: 41, page: 3, pageSize: 20 })).repo.list(3, 20);
    expect(last.ok && last.value.hasMore).toBe(false);
  });

  it('adds a batch, leaving out what a line does not have, and reads the counts', async () => {
    const { repo, calls } = answering(ok({ items: [line({ quantity: 4 })], added: 1, merged: 1 }));
    const r = await repo.add([
      { label: 'Flour', quantity: 2, unit: 'cups', recipeId: 'r1', recipeName: 'Pancakes' },
      { label: 'Salt', quantity: null, unit: null, recipeId: null, recipeName: null },
    ]);
    expect(calls[0]).toMatchObject({
      method: 'POST',
      url: '/me/shopping-list/items',
      data: { items: [{ label: 'Flour', quantity: 2, unit: 'cups', recipeId: 'r1', recipeName: 'Pancakes' }, { label: 'Salt' }] },
    });
    expect(r.ok && [r.value.added, r.value.merged, r.value.items[0]?.quantity]).toEqual([1, 1, 4]);
  });

  it('patches only what changed, sends a cleared amount as null, and deletes by id, checked and all', async () => {
    const patch = answering(ok(line({ checked: true, quantity: null })));
    const r = await patch.repo.update('s 1', { checked: true, quantity: null });
    expect(patch.calls[0]).toMatchObject({ method: 'PATCH', url: '/me/shopping-list/items/s%201', data: { checked: true, quantity: null } });
    expect(r.ok && [r.value.checked, r.value.quantity]).toEqual([true, null]);

    const del = answering(ok({ deleted: 3 }));
    await del.repo.remove('s1');
    const checked = await del.repo.removeChecked();
    const all = await del.repo.removeAll();
    expect(del.calls.map((c) => [c.method, c.url])).toEqual([
      ['DELETE', '/me/shopping-list/items/s1'],
      ['DELETE', '/me/shopping-list/items/checked'],
      ['DELETE', '/me/shopping-list'],
    ]);
    expect([checked.ok && checked.value, all.ok && all.value]).toEqual([3, 3]);
  });

  it('passes a conflict through untouched', async () => {
    const failure = new ConflictFailure('full');
    const r = await answering(fail(failure)).repo.add([{ label: 'x', quantity: null, unit: null, recipeId: null, recipeName: null }]);
    expect(!r.ok && r.failure).toBe(failure);
  });
});
