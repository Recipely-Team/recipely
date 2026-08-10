/**
 * One rule, two callers: the use case that queues an import and the paste
 * screen that tells a user what is wrong before spending a request. Both ask
 * this class, so both answer the same — which is the whole reason it exists.
 *
 * The path check is the part that is easy to skip and expensive to omit: a
 * profile link IS on instagram.com and has no video behind it, so a host-only
 * check sent the worker off to spend two minutes finding that out.
 */

import { InstagramUrl } from '@domain/recipes/import/instagram-url';
import { ErrorMessageKey } from '@core/failure';

const failureKeyOf = (raw: string): string | undefined => {
  const result = InstagramUrl.create(raw);
  if (result.ok) throw new Error(`expected ${raw} to be rejected`);
  return result.failure.messageKey;
};

describe('InstagramUrl', () => {
  describe('the links people actually paste', () => {
    it.each([
      'https://www.instagram.com/reel/Cx1y2z3/',
      'https://instagram.com/p/Cx1y2z3/',
      'https://www.instagram.com/reels/Cx1y2z3/',
      'https://www.instagram.com/tv/Cx1y2z3/',
      'https://instagr.am/reel/Cx1y2z3/',
    ])('accepts %s', (raw) => {
      expect(InstagramUrl.create(raw).ok).toBe(true);
    });

    it('accepts a link with no scheme, because that is how a copied link often arrives', () => {
      const result = InstagramUrl.create('instagram.com/reel/Cx1y2z3/');

      expect(result.ok).toBe(true);
      // The backend needs a real URL, so the scheme is put back on the way out.
      if (result.ok) expect(result.value.value.startsWith('https://')).toBe(true);
    });

    it('accepts a link carrying tracking query parameters', () => {
      expect(InstagramUrl.create('https://www.instagram.com/reel/Cx1y2z3/?igsh=abc123').ok).toBe(true);
    });

    it('trims what the clipboard brought along', () => {
      expect(InstagramUrl.create('  https://www.instagram.com/reel/Cx1y2z3/  ').ok).toBe(true);
    });
  });

  describe('the links that cannot work', () => {
    it('refuses an empty string as an invalid URL, not as a different kind of problem', () => {
      expect(failureKeyOf('   ')).toBe(ErrorMessageKey.importInvalidUrl);
    });

    it('names a non-Instagram host as exactly that, so the copy can say so', () => {
      expect(failureKeyOf('https://www.tiktok.com/@chef/video/123')).toBe(
        ErrorMessageKey.importNotInstagram,
      );
    });

    it('refuses a profile link — the right host, but no post behind it', () => {
      expect(failureKeyOf('https://www.instagram.com/somechef/')).toBe(
        ErrorMessageKey.importInvalidUrl,
      );
    });

    it('refuses the explore page for the same reason', () => {
      expect(failureKeyOf('https://www.instagram.com/explore/tags/pasta/')).toBe(
        ErrorMessageKey.importInvalidUrl,
      );
    });

    it('refuses a post path with no id', () => {
      expect(failureKeyOf('https://www.instagram.com/reel/')).toBe(ErrorMessageKey.importInvalidUrl);
    });

    it('refuses something that is not a URL at all', () => {
      // Unparseable, so it never gets as far as the host check.
      expect(failureKeyOf('just some words')).toBe(ErrorMessageKey.importInvalidUrl);
    });
  });

  it('keeps the raw link out of the user-facing channel — the message is for developers', () => {
    const result = InstagramUrl.create('https://www.tiktok.com/@chef/video/123');

    // The parenthesised URL matters: `ValidationFailure.fieldErrors` splits on
    // ': ', so a colon here would parse back as a phantom field name.
    if (!result.ok) expect(result.failure.message).toContain('(https://www.tiktok.com');
  });
});
