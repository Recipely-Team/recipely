/**
 * One rule, three callers: the use case that queues an import, the paste
 * screen that says what is wrong before spending a request, and the share
 * intent. Both video platforms need a path as much as a host — a profile is on
 * instagram.com and has no video behind it — and any other public page is a
 * recipe candidate the backend reads from its markup.
 */
import { ImportLink } from '@domain/recipes/import/import-link';
import { SourcePlatform } from '@domain/recipes/provenance/source-platform';
import { ErrorMessageKey } from '@core/failure';

const accepted = (raw: string): ImportLink => {
  const result = ImportLink.create(raw);
  if (!result.ok) throw new Error(`expected ${raw} to be accepted`);
  return result.value;
};
const failureKeyOf = (raw: string): string | undefined => {
  const result = ImportLink.create(raw);
  if (result.ok) throw new Error(`expected ${raw} to be rejected`);
  return result.failure.messageKey;
};

describe('ImportLink', () => {
  describe('Instagram', () => {
    it.each([
      'https://www.instagram.com/reel/Cx1y2z3/',
      'https://instagram.com/p/Cx1y2z3/',
      'https://www.instagram.com/reels/Cx1y2z3/',
      'https://www.instagram.com/tv/Cx1y2z3/',
      'instagram.com/reel/Cx1y2z3',
    ])('accepts %s', (raw) => {
      expect(accepted(raw).platform).toBe(SourcePlatform.Instagram);
    });

    // The backend's allowlist names instagram.com. A short-domain link sent
    // as-is would be read as a web page and fail there, minutes later.
    it('sends the short domain on as the canonical instagram.com link', () => {
      expect(accepted('https://instagr.am/reel/Cx1y2z3/').value).toBe('https://www.instagram.com/reel/Cx1y2z3/');
    });

    it('confirms the identifying part in a form that fits the field', () => {
      expect(accepted('https://www.instagram.com/reel/Cx1y2z3/?igsh=abc').shortForm).toBe('instagram.com/reel/Cx1y2z3');
    });

    it('refuses a profile, which has no video behind it', () => {
      expect(failureKeyOf('https://www.instagram.com/some.chef/')).toBe(ErrorMessageKey.importInvalidUrl);
    });
  });

  describe('TikTok', () => {
    it.each([
      'https://www.tiktok.com/@mutfaktaki_hayat/video/7300000000000000000',
      'https://vm.tiktok.com/ZMabc123/',
      'https://www.tiktok.com/t/ZTabc123/',
    ])('accepts %s', (raw) => {
      expect(accepted(raw).platform).toBe(SourcePlatform.TikTok);
    });

    it('refuses a TikTok profile, which has no single video', () => {
      expect(failureKeyOf('https://www.tiktok.com/@mutfaktaki_hayat')).toBe(ErrorMessageKey.importInvalidUrl);
    });
  });

  describe('recipe web pages', () => {
    it('accepts any public page and names it by its site', () => {
      const link = accepted('https://www.nefisyemektarifleri.com/menemen-tarifi/');
      expect(link.platform).toBe(SourcePlatform.Web);
      expect(link.host).toBe('nefisyemektarifleri.com');
      expect(link.isVideo).toBe(false);
    });

    it('keeps a long page address short enough to read in the field', () => {
      const link = accepted(`https://example.com/${'a'.repeat(80)}`);
      expect(link.shortForm.length).toBeLessThanOrEqual(49);
    });

    // Recipes live on these, but the import cannot read them; saying so now
    // beats a minute of waiting for "no recipe on that page".
    it.each(['https://www.youtube.com/watch?v=x', 'https://youtu.be/x', 'https://www.facebook.com/x/videos/1', 'https://x.com/a/status/1', 'https://pin.it/abc'])(
      'names %s as a site it cannot import from',
      (raw) => {
        expect(failureKeyOf(raw)).toBe(ErrorMessageKey.importNotInstagram);
      },
    );

    it.each(['http://169.254.169.254/latest/meta-data/', 'http://127.0.0.1/', 'http://intranet/', 'ftp://example.com/x', 'not a link at all'])(
      'refuses %s',
      (raw) => {
        expect(failureKeyOf(raw)).toBe(ErrorMessageKey.importInvalidUrl);
      },
    );
  });

  it('treats an empty field as an invalid link', () => {
    expect(failureKeyOf('   ')).toBe(ErrorMessageKey.importInvalidUrl);
  });
});
