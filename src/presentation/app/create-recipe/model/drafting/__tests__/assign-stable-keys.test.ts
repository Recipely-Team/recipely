import { assignStableKeys } from '@presentation/app/create-recipe/model/drafting/assign-stable-keys';

const keyFrom = () => {
  let n = 0;
  return () => `n${String((n += 1))}`;
};

// Editable steps and ingredient lines were keyed by index: removing a row
// re-keyed every row below it, so focus and height jumped to a sibling.
describe('assignStableKeys', () => {
  it('keeps the remaining rows\' keys when a row is removed', () => {
    expect(assignStableKeys(['a', 'b', 'c'], ['k1', 'k2', 'k3'], ['a', 'c'], keyFrom())).toEqual(['k1', 'k3']);
  });

  it('gives only the added row a new key', () => {
    expect(assignStableKeys(['a', 'b'], ['k1', 'k2'], ['a', 'b', ''], keyFrom())).toEqual(['k1', 'k2', 'n1']);
  });

  it('keeps every key in place while one row is edited', () => {
    expect(assignStableKeys(['a', 'b'], ['k1', 'k2'], ['a', 'bx'], keyFrom())).toEqual(['k1', 'k2']);
  });

  it('moves the keys with the rows when two rows swap', () => {
    expect(assignStableKeys(['a', 'b', 'c'], ['k1', 'k2', 'k3'], ['b', 'a', 'c'], keyFrom())).toEqual(['k2', 'k1', 'k3']);
  });

  it('keeps positions for duplicate empty rows', () => {
    expect(assignStableKeys(['', '', 'x'], ['k1', 'k2', 'k3'], ['', 'x'], keyFrom())).toEqual(['k1', 'k3']);
  });
});
