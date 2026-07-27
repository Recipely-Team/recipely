/**
 * Publishing a recipe deep-links here with `?tab=created`. Anything else — a
 * hand-typed URL, an old link, no parameter at all — must land on the default
 * tab rather than an undefined one.
 */

import { parseTabParam } from '@presentation/app/my-recipes/model/parse-tab-param';

describe('parseTabParam', () => {
  it('takes a known tab from the link', () => {
    expect(parseTabParam('created')).toBe('created');
    expect(parseTabParam('drafts')).toBe('drafts');
  });

  it('falls back to the saved tab for anything else', () => {
    expect(parseTabParam(undefined)).toBe('saved');
    expect(parseTabParam('')).toBe('saved');
    expect(parseTabParam('nonsense')).toBe('saved');
  });
});
