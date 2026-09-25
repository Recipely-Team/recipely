import { BaseValueObject } from '@core/value-object/base-value-object';
import { fail, ok } from '@core/result/result-helpers';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import type { Result } from '@core/result/result';
import { ErrorMessageKey, ValidationFailure } from '@core/failure';
import { CharConstants, ValueConstants } from '@core/constants';
import { SourcePlatform, type SourcePlatformType } from '@domain/recipes/provenance/source-platform';

const INSTAGRAM_HOSTS: readonly string[] = ['instagram.com', 'instagr.am'];
const TIKTOK_HOSTS: readonly string[] = ['tiktok.com'];
/** TikTok's share-sheet short links; the backend's yt-dlp follows them. */
const TIKTOK_SHORT_HOSTS: readonly string[] = ['vm.tiktok.com', 'vt.tiktok.com'];
/** Sites with recipes on them that this import cannot read: video it has no pipeline for, or no page to read. */
const UNSUPPORTED_HOSTS: readonly string[] = [
  'youtube.com', 'youtu.be', 'facebook.com', 'fb.watch', 'x.com', 'twitter.com', 'pinterest.com', 'pin.it',
];
/** The four path shapes that address a single Instagram post: post, reel, reels, TV. */
const INSTAGRAM_POST = /^\/(p|reel|reels|tv)\/([^/?#]+)/;
/** A TikTok video page, `/@account/video/123`, or the `/t/abc` short form. */
const TIKTOK_VIDEO = /^\/(?:@[^/]+\/video\/\d+|t\/[^/?#]+)/;
const LEADING_SUBDOMAIN = /^(?:www|m)\./;
const HTTP_PREFIX = /^https?:\/\//i;
const WEB_PROTOCOLS: readonly string[] = ['http:', 'https:'];
const IPV4_LITERAL = /^\d{1,3}(?:\.\d{1,3}){3}$/;
const TRAILING_SLASH = /\/+$/;
/** How much of a web page's path the confirmation line shows before it trails off. */
const SHORT_FORM_MAX = 48;
const ELLIPSIS = '…';

/**
 * A link an import can run against: an Instagram post, a TikTok video, or a
 * recipe web page — and which of the three it is.
 *
 * @remarks
 * - **One rule, three callers.** The use case that queues the import, the
 *   paste screen that says what is wrong BEFORE a round trip, and the share
 *   intent. Separate copies of "can this be imported" would answer differently
 *   the first time any was touched.
 * - **A video link needs its path as much as its host.** A profile is on
 *   `instagram.com` and has no video behind it; the worker would spend two
 *   minutes discovering that.
 * - **Instagram leaves here canonical** (`https://www.instagram.com/reel/x/`):
 *   the backend's allowlist names that host, and `instagr.am` would otherwise
 *   be read as a web page and fail as one.
 * - **Any other public web page is a candidate**, because most recipe sites
 *   publish their recipe as markup the backend reads directly. The sites that
 *   are known NOT to work are refused by name, so the user hears "we can't
 *   import from there" instead of waiting for a page with no recipe on it.
 * - **The scheme is optional on the way in.** People paste `instagram.com/reel/x`
 *   as often as the full URL.
 */
export class ImportLink extends BaseValueObject<string> {
  private constructor(
    raw: string,
    readonly platform: SourcePlatformType,
    /** The site as a person names it: `nefisyemektarifleri.com`. */
    readonly host: string,
    /**
     * The link as a person can check it at a glance — `instagram.com/reel/Cx1y2z3`.
     * A pasted URL overflows a single-line field, so this is the confirmation
     * that the identifying part came along.
     */
    readonly shortForm: string,
  ) {
    super(raw);
  }

  static create(raw: string): Result<ImportLink, ValidationFailure> {
    const trimmed = raw.trim();
    if (trimmed.length === ValueConstants.zero) {
      return fail(new ValidationFailure(DiagnosticMessage.recipeImport.urlRequired, undefined, ErrorMessageKey.importInvalidUrl));
    }

    let url: URL;
    try {
      url = new URL(HTTP_PREFIX.test(trimmed) ? trimmed : `https://${trimmed}`);
    } catch {
      return fail(ImportLink.invalid(trimmed));
    }
    if (!WEB_PROTOCOLS.includes(url.protocol)) return fail(ImportLink.invalid(trimmed));

    const fullHost = url.hostname.toLowerCase();
    const host = fullHost.replace(LEADING_SUBDOMAIN, CharConstants.empty);
    const path = url.pathname;

    if (INSTAGRAM_HOSTS.includes(host)) {
      const post = INSTAGRAM_POST.exec(path);
      const [, kind, code] = post ?? [];
      if (kind === undefined || code === undefined) return fail(ImportLink.invalid(trimmed));
      return ok(new ImportLink(`https://www.instagram.com/${kind}/${code}/`, SourcePlatform.Instagram, 'instagram.com', `instagram.com/${kind}/${code}`));
    }
    if (TIKTOK_SHORT_HOSTS.includes(fullHost) || (TIKTOK_HOSTS.includes(host) && TIKTOK_VIDEO.test(path))) {
      const short = `${host}${path.replace(TRAILING_SLASH, CharConstants.empty)}`;
      return ok(new ImportLink(url.toString(), SourcePlatform.TikTok, 'tiktok.com', short));
    }
    // A profile is on tiktok.com and has no single video behind it.
    if (TIKTOK_HOSTS.includes(host)) return fail(ImportLink.invalid(trimmed));
    if (UNSUPPORTED_HOSTS.some((h) => host === h || host.endsWith(`.${h}`))) {
      return fail(ImportLink.unsupported(trimmed));
    }

    const isAddressLiteral = IPV4_LITERAL.test(fullHost) || fullHost.includes(':') || fullHost.startsWith('[');
    if (isAddressLiteral || !fullHost.includes('.') || url.username !== CharConstants.empty) {
      return fail(ImportLink.invalid(trimmed));
    }
    const page = `${host}${path.replace(TRAILING_SLASH, CharConstants.empty)}`;
    const shortForm = page.length > SHORT_FORM_MAX ? `${page.slice(0, SHORT_FORM_MAX)}${ELLIPSIS}` : page;
    return ok(new ImportLink(url.toString(), SourcePlatform.Web, host, shortForm));
  }

  /** True for a video post, which the backend runs through a model; false for a page it reads. */
  get isVideo(): boolean {
    return this.platform !== SourcePlatform.Web;
  }

  /**
   * NOTE the parenthesised url: `ValidationFailure.fieldErrors` splits `message`
   * on `': '`, so a colon here would parse back as a phantom field.
   */
  private static unsupported(url: string): ValidationFailure {
    return new ValidationFailure(
      DiagnosticMessage.recipeImport.unsupportedSite(url),
      undefined,
      ErrorMessageKey.importNotInstagram,
    );
  }

  private static invalid(url: string): ValidationFailure {
    return new ValidationFailure(
      DiagnosticMessage.recipeImport.notImportable(url),
      undefined,
      ErrorMessageKey.importInvalidUrl,
    );
  }
}
