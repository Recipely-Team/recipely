import { BaseValueObject } from '@core/value-object/base-value-object';
import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import { ValidationFailure } from '@core/failure';
import { DiagnosticMessage, FailureField } from '@core/failure/diagnostic-message';
import { CharConstants } from '@core/constants';
import { CreatorPlatform, type CreatorPlatformType } from '@domain/creators/creator-platform';
import { CreatorHandle } from '@domain/creators/creator-handle';

interface CreatorTagValue {
  readonly platform: CreatorPlatformType;
  readonly handle: CreatorHandle;
}

const PLATFORMS: ReadonlySet<string> = new Set(Object.values(CreatorPlatform));

/**
 * One claimed account: a platform and a handle valid for it.
 *
 * @remarks
 * - **`create` takes the platform as a string** so a mapper can hand it a wire
 *   value: a platform this build has no word for fails here, and the mapper
 *   reads that as "no tag" rather than drawing a mark it cannot name.
 * - **Equality compares both halves** — the base class compares by `===`,
 *   which an object value never satisfies. `instagram/ada` and `tiktok/ada`
 *   are different accounts.
 */
export class CreatorTag extends BaseValueObject<CreatorTagValue> {
  private constructor(value: CreatorTagValue) {
    super(value);
  }

  static create(platform: string, handle: string): Result<CreatorTag, ValidationFailure> {
    if (!CreatorTag.isPlatform(platform)) {
      return fail(
        new ValidationFailure(DiagnosticMessage.creator.platformInvalid(platform), FailureField.creatorPlatform),
      );
    }
    const parsed = CreatorHandle.create(handle, platform);
    if (!parsed.ok) return parsed;
    return ok(new CreatorTag({ platform, handle: parsed.value }));
  }

  get platform(): CreatorPlatformType {
    return this._value.platform;
  }

  /** The normalised handle, without `@`. */
  get handle(): string {
    return this._value.handle.value;
  }

  /** `@handle`, for the badge and the profile header. */
  get displayHandle(): string {
    return this._value.handle.display;
  }

  override equals(other: BaseValueObject<CreatorTagValue>): boolean {
    return (
      this._value.platform === other.value.platform &&
      this._value.handle.equals(other.value.handle)
    );
  }

  override toString(): string {
    return `${this._value.platform}${CharConstants.colon}${this._value.handle.value}`;
  }

  private static isPlatform(raw: string): raw is CreatorPlatformType {
    return PLATFORMS.has(raw);
  }
}
