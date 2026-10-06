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
/** The backend's Facebook hosts, spelled out: `web.` is Facebook's own desktop mirror. */
const FACEBOOK_HOSTS: readonly string[] = ['facebook.com', 'www.facebook.com', 'm.facebook.com', 'web.facebook.com'];
const FACEBOOK_SHORT_HOST = 'fb.watch';
/** The backend's YouTube hosts; `youtu.be/<id>` is the share sheet's form. */
const YOUTUBE_HOSTS: readonly string[] = ['youtube.com', 'www.youtube.com', 'm.youtube.com'];
const YOUTUBE_SHORT_HOST = 'youtu.be';
/** Sites with recipes on them that this import cannot read: no video pipeline, no page to read. */
const UNSUPPORTED_HOSTS: readonly string[] = ['x.com', 'twitter.com'];
/** Any other subdomain of a video platform is that platform, not a web page, and holds no video we read. */
const VIDEO_PLATFORM_DOMAINS: readonly string[] = ['facebook.com', 'youtube.com'];
/** The four path shapes that address a single Instagram post: post, reel, reels, TV. */
const INSTAGRAM_POST = /^\/(p|reel|reels|tv)\/([^/?#]+)/;
/** A TikTok video page, `/@account/video/123`, or the `/t/abc` short form. */
const TIKTOK_VIDEO = /^\/(?:@[^/]+\/video\/\d+|t\/[^/?#]+)/;
/** A Facebook video: a reel, a share link, `/watch`, or a page's `/videos/<id>`. */
const FACEBOOK_VIDEO = /^\/(?:reel\/\d+|share\/[vr]\/[^/?#]+|watch\/?$|(?:[^/]+\/)?videos\/(?:[^/]+\/)?\d+)/;
/** `/shorts/<id>`, `/live/<id>`, `/embed/<id>` and `/v/<id>` name the video in the path, as the backend reads them. */
const YOUTUBE_PATH_VIDEO = /^\/(?:shorts|live|embed|v)\/([A-Za-z0-9_-]{11})(?:[/?#]|$)/i;
/** Every YouTube video id is eleven characters of this alphabet. */
const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const YOUTUBE_WATCH_PATH = /^\/watch\/?$/;
const WATCH_PARAM = 'v';
const LEADING_SUBDOMAIN = /^(?:www|m|web)\./;
const HTTP_PREFIX = /^https?:\/\//i;
const WEB_PROTOCOLS: readonly string[] = ['http:', 'https:'];
const IPV4_LITERAL = /^\d{1,3}(?:\.\d{1,3}){3}$/;
const TRAILING_SLASH = /\/+$/;
/** How much of a web page's path the confirmation line shows before it trails off. */
const SHORT_FORM_MAX = 48;
const ELLIPSIS = '…';

/**
 * A link an import can run against: an Instagram post, a TikTok, Facebook or
 * YouTube video, or a recipe web page — and which of them it is.
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
 * - **Facebook and YouTube take the backend's exact hosts** — `www.`, `m.` and
 *   (Facebook) `web.`, plus `fb.watch` and `youtu.be` — and a path that names
 *   one video: a page, a channel or a playlist is refused before the queue.
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
    if (FACEBOOK_HOSTS.includes(fullHost) || fullHost === FACEBOOK_SHORT_HOST) {
      const isVideo = fullHost === FACEBOOK_SHORT_HOST
        ? path.replace(TRAILING_SLASH, CharConstants.empty).length > ValueConstants.one
        : FACEBOOK_VIDEO.test(path) && (!path.startsWith('/watch') || url.searchParams.has(WATCH_PARAM));
      if (!isVideo) return fail(ImportLink.invalid(trimmed));
      return ok(new ImportLink(url.toString(), SourcePlatform.Facebook, host, ImportLink.shorten(`${host}${path}`)));
    }
    if (YOUTUBE_HOSTS.includes(fullHost) || fullHost === YOUTUBE_SHORT_HOST) {
      const id = ImportLink.youTubeVideoId(url, fullHost);
      if (id === null) return fail(ImportLink.invalid(trimmed));
      return ok(new ImportLink(url.toString(), SourcePlatform.YouTube, 'youtube.com', `youtube.com/watch?v=${id}`));
    }
    if (VIDEO_PLATFORM_DOMAINS.some((h) => host.endsWith(`.${h}`))) return fail(ImportLink.invalid(trimmed));
    if (UNSUPPORTED_HOSTS.some((h) => host === h || host.endsWith(`.${h}`))) {
      return fail(ImportLink.unsupported(trimmed));
    }

    const isAddressLiteral = IPV4_LITERAL.test(fullHost) || fullHost.includes(':') || fullHost.startsWith('[');
    if (isAddressLiteral || !fullHost.includes('.') || url.username !== CharConstants.empty) {
      return fail(ImportLink.invalid(trimmed));
    }
    return ok(new ImportLink(url.toString(), SourcePlatform.Web, host, ImportLink.shorten(`${host}${path}`)));
  }

  /** True for a video post, which the backend runs through a model; false for a page it reads. */
  get isVideo(): boolean {
    return this.platform !== SourcePlatform.Web;
  }

  private static shorten(page: string): string {
    const bare = page.replace(TRAILING_SLASH, CharConstants.empty);
    return bare.length > SHORT_FORM_MAX ? `${bare.slice(ValueConstants.zero, SHORT_FORM_MAX)}${ELLIPSIS}` : bare;
  }

  /** The id a YouTube link names — the same forms the backend reads — or `null` for a channel or a playlist. */
  private static youTubeVideoId(url: URL, fullHost: string): string | null {
    const path = url.pathname;
    const candidate = fullHost === YOUTUBE_SHORT_HOST
      ? path.slice(ValueConstants.one).replace(TRAILING_SLASH, CharConstants.empty)
      : YOUTUBE_WATCH_PATH.test(path)
        ? url.searchParams.get(WATCH_PARAM)
        : YOUTUBE_PATH_VIDEO.exec(path)?.[ValueConstants.one];
    return candidate !== null && candidate !== undefined && YOUTUBE_ID.test(candidate) ? candidate : null;
  }

  /**
   * NOTE the parenthesised url: `ValidationFailure.fieldErrors` splits `message`
   * on `': '`, so a colon here would parse back as a phantom field.
   */
  private static unsupported(url: string): ValidationFailure {
    return new ValidationFailure(
      DiagnosticMessage.recipeImport.unsupportedSite(url),
      undefined,
      ErrorMessageKey.importUnsupportedSource,
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
