import { ShoppingOutbox } from '@domain/shopping/outbox/shopping-outbox';
import { ShoppingPendingWriteKind } from '@domain/shopping/outbox/shopping-pending-write-kind';

const check = (itemId: string, isChecked: boolean) => ({ kind: ShoppingPendingWriteKind.Check, itemId, isChecked }) as const;
const remove = (itemId: string) => ({ kind: ShoppingPendingWriteKind.Delete, itemId }) as const;

describe('ShoppingOutbox', () => {
  it('keeps one write per line, the last one, in the order lines were first touched', () => {
    const outbox = ShoppingOutbox.empty().with(check('a', true)).with(check('b', true)).with(check('a', false));
    expect(outbox.writes).toEqual([check('a', false), check('b', true)]);
  });

  it('lets a delete replace a tick, and ignores a tick after a delete', () => {
    const outbox = ShoppingOutbox.empty().with(check('a', true)).with(remove('a')).with(check('a', false));
    expect(outbox.writes).toEqual([remove('a')]);
  });

  it('rebuilds from stored writes with the same rule, and drops a sent line', () => {
    const outbox = ShoppingOutbox.of([check('a', true), check('a', false), remove('b')]);
    expect(outbox.writes).toEqual([check('a', false), remove('b')]);
    expect(outbox.without('a').writes).toEqual([remove('b')]);
    expect(outbox.without('a').without('b').isEmpty()).toBe(true);
  });
});
