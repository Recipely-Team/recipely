import { BaseValueObject } from '@core/value-object/base-value-object';
import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import { ValidationFailure } from '@core/failure';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import { CreatorStatus } from '@domain/creators/creator-status';
import type { CreatorTag } from '@domain/creators/creator-tag';

interface CreatorClaimValue {
  readonly tag: CreatorTag;
  readonly status: CreatorStatus;
}

const CLAIM_STATUSES: ReadonlySet<string> = new Set([
  CreatorStatus.Pending,
  CreatorStatus.Approved,
  CreatorStatus.Rejected,
]);

const isClaimStatus = (raw: string): raw is CreatorStatus => CLAIM_STATUSES.has(raw);

/**
 * The signed-in user's own creator claim: which account, and where review
 * stands.
 *
 * @remarks
 * - **There is no `none` claim.** Status `none` is the absence of a claim, so
 *   the user holds `null` instead and `create` refuses `none`.
 */
export class CreatorClaim extends BaseValueObject<CreatorClaimValue> {
  private constructor(value: CreatorClaimValue) {
    super(value);
  }

  static create(tag: CreatorTag, status: string): Result<CreatorClaim, ValidationFailure> {
    if (!isClaimStatus(status)) {
      return fail(new ValidationFailure(DiagnosticMessage.creator.claimStatusInvalid(status)));
    }
    return ok(new CreatorClaim({ tag, status }));
  }

  get tag(): CreatorTag {
    return this._value.tag;
  }

  get status(): CreatorStatus {
    return this._value.status;
  }

  get isPending(): boolean {
    return this._value.status === CreatorStatus.Pending;
  }

  get isApproved(): boolean {
    return this._value.status === CreatorStatus.Approved;
  }

  get isRejected(): boolean {
    return this._value.status === CreatorStatus.Rejected;
  }

  /** The tag, while an admin has approved it — what the badge shows; `null` under review or refused. */
  get approvedTag(): CreatorTag | null {
    return this.isApproved ? this._value.tag : null;
  }

  override equals(other: BaseValueObject<CreatorClaimValue>): boolean {
    return this._value.status === other.value.status && this._value.tag.equals(other.value.tag);
  }
}
