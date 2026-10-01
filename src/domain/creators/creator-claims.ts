import { BaseValueObject } from '@core/value-object/base-value-object';
import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import { ValidationFailure } from '@core/failure';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import { ValueConstants } from '@core/constants';
import { CreatorPlatform, type CreatorPlatformType } from '@domain/creators/creator-platform';
import type { CreatorClaim } from '@domain/creators/creator-claim';
import type { CreatorTag } from '@domain/creators/creator-tag';

/** Instagram first, then TikTok — the wire's order and the screen's. */
const PLATFORM_ORDER: readonly CreatorPlatformType[] = Object.values(CreatorPlatform);

const ordered = (claims: readonly CreatorClaim[]): readonly CreatorClaim[] =>
  [...claims].sort((a, b) => PLATFORM_ORDER.indexOf(a.tag.platform) - PLATFORM_ORDER.indexOf(b.tag.platform));

/**
 * The signed-in user's creator claims — at most one per platform, each
 * reviewed on its own.
 *
 * @remarks
 * - **Absent is "none".** A platform with no claim simply has no entry; there
 *   is no `none` claim to hold.
 * - **One per platform, enforced here.** A second claim for a platform is
 *   refused by `create`, and `with` replaces the platform's claim rather than
 *   adding beside it.
 * - **A creator is a user with at least one approved claim**; a second
 *   approved platform changes nothing about that.
 * - **Immutable.** `with` / `without` return new collections.
 */
export class CreatorClaims extends BaseValueObject<readonly CreatorClaim[]> {
  private constructor(value: readonly CreatorClaim[]) {
    super(value);
  }

  static create(claims: readonly CreatorClaim[]): Result<CreatorClaims, ValidationFailure> {
    const seen = new Set<CreatorPlatformType>();
    for (const claim of claims) {
      if (seen.has(claim.tag.platform)) {
        return fail(new ValidationFailure(DiagnosticMessage.creator.duplicatePlatform(claim.tag.platform)));
      }
      seen.add(claim.tag.platform);
    }
    return ok(new CreatorClaims(ordered(claims)));
  }

  static empty(): CreatorClaims {
    return new CreatorClaims([]);
  }

  /** Every claim, Instagram first. */
  get all(): readonly CreatorClaim[] {
    return this._value;
  }

  get isEmpty(): boolean {
    return this._value.length === ValueConstants.zero;
  }

  /** At least one platform approved — the Profile badge's rule. */
  get isCreator(): boolean {
    return this._value.some((claim) => claim.isApproved);
  }

  /** The approved accounts, Instagram first. */
  get approvedTags(): readonly CreatorTag[] {
    return this._value.filter((claim) => claim.isApproved).map((claim) => claim.tag);
  }

  /** The claim for `platform`, or `null` when there is none. */
  forPlatform(platform: CreatorPlatformType): CreatorClaim | null {
    return this._value.find((claim) => claim.tag.platform === platform) ?? null;
  }

  /** These claims with `claim` in place of its platform's previous one. */
  with(claim: CreatorClaim): CreatorClaims {
    return new CreatorClaims(ordered([...this.others(claim.tag.platform), claim]));
  }

  /** These claims with `platform`'s removed. */
  without(platform: CreatorPlatformType): CreatorClaims {
    return new CreatorClaims(this.others(platform));
  }

  override equals(other: BaseValueObject<readonly CreatorClaim[]>): boolean {
    const theirs = other.value;
    return theirs.length === this._value.length && this._value.every((claim, index) => {
      const their = theirs[index];
      return their !== undefined && claim.equals(their);
    });
  }

  private others(platform: CreatorPlatformType): readonly CreatorClaim[] {
    return this._value.filter((claim) => claim.tag.platform !== platform);
  }
}
