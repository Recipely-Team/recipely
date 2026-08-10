import { BaseValueObject } from '@core/value-object/base-value-object';
import { fail, ok } from '@core/result/result-helpers';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import type { Result } from '@core/result/result';
import { ErrorMessageKey, ValidationFailure } from '@core/failure';
import { CharConstants, ValueConstants } from '@core/constants';

/** Hosts that serve an Instagram post, including the short domain. */
const INSTAGRAM_HOSTS: readonly string[] = ['instagram.com', 'instagr.am'];
/** The four path shapes that address a single post: post, reel, reels, TV. */
const POST_PATH = /^\/(p|reel|reels|tv)\/([^/?#]+)/;
const WWW_PREFIX = /^www\./;
const HTTP_PREFIX = /^https?:\/\//i;

/**
 * A link that actually points at one Instagram post.
 *
 * @remarks
 * - **Why a value object.** The same three rules were needed in two places —
 *   the use case that queues an import, and the screen that lets a user paste a
 *   link and expects to be told what is wrong BEFORE a round trip. Two copies
 *   of "is this an Instagram URL" would have answered differently the first
 *   time either was touched.
 * - **The path matters as much as the host.** A profile page is on
 *   `instagram.com` and has no video, so a host-only check sent the worker off
 *   to spend two minutes discovering that. `/p`, `/reel`, `/reels` and `/tv`
 *   are the four shapes that address a single post.
 * - **The scheme is optional on the way in.** People paste `instagram.com/reel/x`
 *   as often as the full URL, and refusing that would be pedantry; `value`
 *   always comes back with the scheme the backend needs.
 */
export class InstagramUrl extends BaseValueObject<string> {
  private constructor(
    raw: string,
    /** `p`, `reel`, `reels` or `tv` — Instagram's own word for the post kind. */
    readonly kind: string,
    /** The post's short code, the part that identifies it. */
    readonly shortcode: string,
  ) {
    super(raw);
  }

  /**
   * The link as a person can check it at a glance: `instagram.com/reel/Cx1y2z3`.
   *
   * A pasted URL is long enough to overflow a single-line field, so the user
   * sees `https://www.instagram.com/p/` and has no way to tell whether the part
   * that identifies the post came along. This is the part they need to see.
   */
  get shortForm(): string {
    return `instagram.com/${this.kind}/${this.shortcode}`;
  }

  static create(raw: string): Result<InstagramUrl, ValidationFailure> {
    const trimmed = raw.trim();
    if (trimmed.length === ValueConstants.zero) {
      return fail(
        new ValidationFailure(
          DiagnosticMessage.recipeImport.urlRequired,
          undefined,
          ErrorMessageKey.importInvalidUrl,
        ),
      );
    }

    const withScheme = HTTP_PREFIX.test(trimmed) ? trimmed : `https://${trimmed}`;
    let url: URL;
    try {
      url = new URL(withScheme);
    } catch {
      return fail(InstagramUrl.invalid(trimmed));
    }

    const host = url.hostname.toLowerCase().replace(WWW_PREFIX, CharConstants.empty);
    if (!INSTAGRAM_HOSTS.includes(host)) {
      return fail(InstagramUrl.notInstagram(trimmed));
    }
    const post = POST_PATH.exec(url.pathname);
    if (post === null) {
      return fail(InstagramUrl.invalid(trimmed));
    }
    const [, kind, shortcode] = post;
    if (kind === undefined || shortcode === undefined) {
      return fail(InstagramUrl.invalid(trimmed));
    }
    return ok(new InstagramUrl(url.toString(), kind, shortcode));
  }

  /**
   * NOTE the parenthesised url: `ValidationFailure.fieldErrors` splits `message`
   * on `': '`, so a colon here would parse back as a phantom field.
   */
  private static notInstagram(url: string): ValidationFailure {
    return new ValidationFailure(
      DiagnosticMessage.recipeImport.notAnInstagramUrl(url),
      undefined,
      ErrorMessageKey.importNotInstagram,
    );
  }

  private static invalid(url: string): ValidationFailure {
    return new ValidationFailure(
      DiagnosticMessage.recipeImport.notAPostUrl(url),
      undefined,
      ErrorMessageKey.importInvalidUrl,
    );
  }
}
