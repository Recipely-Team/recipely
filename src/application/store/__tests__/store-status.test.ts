import { StoreStatus } from '@application/store/store-status';

/**
 * The whole point of this vocabulary is that one phase name is written down
 * once. Two members sharing a value is not a compile error — the union simply
 * collapses, and two states become indistinguishable at runtime while still
 * reading as separate names at every call site.
 */
describe('StoreStatus', () => {
  it('has no two members sharing a value', () => {
    const values = Object.values(StoreStatus);

    expect(new Set(values).size).toBe(values.length);
  });

  it('names every phase in lower case, matching what the unions declare', () => {
    const odd = Object.values(StoreStatus).filter((v) => v !== v.toLowerCase());

    expect(odd).toEqual([]);
  });
});
