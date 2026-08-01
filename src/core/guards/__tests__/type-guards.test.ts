import { isObject, isString, isNonEmptyString, hasKey, optional } from '@core/guards/type-guards';

/**
 * These narrow values the app did not create — response bodies, decoded JWT
 * payloads, platform globals. The cases below are the ones the hand-written
 * checks kept getting wrong: `typeof null` is `'object'`, an empty string is a
 * string, and a key that exists holding `undefined` still exists.
 */

describe('isObject', () => {
  it('rejects null, which typeof calls an object', () => {
    expect(isObject(null)).toBe(false);
  });

  it.each([{}, { a: 1 }, []])('accepts %p', (value) => {
    expect(isObject(value)).toBe(true);
  });

  it.each(['s', 1, undefined, true])('rejects %p', (value) => {
    expect(isObject(value)).toBe(false);
  });
});

describe('isNonEmptyString', () => {
  it('rejects the empty string, which isString accepts', () => {
    expect(isString('')).toBe(true);
    expect(isNonEmptyString('')).toBe(false);
  });

  it('accepts a string with content', () => {
    expect(isNonEmptyString('token')).toBe(true);
  });

  it.each([null, undefined, 0, {}])('rejects %p', (value) => {
    expect(isNonEmptyString(value)).toBe(false);
  });
});

describe('hasKey', () => {
  it('finds a key that is present but undefined', () => {
    // `'data' in body` is the check, not `body.data !== undefined` — a backend
    // that answers `{ data: undefined }` has still answered in the right shape.
    expect(hasKey({ data: undefined }, 'data')).toBe(true);
  });

  it('rejects a missing key', () => {
    expect(hasKey({ other: 1 }, 'data')).toBe(false);
  });

  it('rejects a non-object without throwing', () => {
    expect(hasKey(null, 'data')).toBe(false);
    expect(hasKey('data', 'data')).toBe(false);
  });
});

describe('optional', () => {
  it('omits the key entirely when there is no value', () => {
    expect(optional('bio', undefined)).toEqual({});
    expect('bio' in optional('bio', undefined)).toBe(false);
  });

  it('omits an empty string, which is not a value worth sending', () => {
    expect(optional('bio', '')).toEqual({});
  });

  it('includes the key when there is a value', () => {
    expect(optional('bio', 'cook')).toEqual({ bio: 'cook' });
  });
});
