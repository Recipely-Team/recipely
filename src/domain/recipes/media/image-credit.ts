import { BaseValueObject } from '@core/value-object/base-value-object';
import { fail, ok } from '@core/result/result-helpers';
import { DiagnosticMessage, FailureField } from '@core/failure/diagnostic-message';
import type { Result } from '@core/result/result';
import { ValidationFailure } from '@core/failure';
import { CharConstants, RegexConstants, ValueConstants } from '@core/constants';

interface ImageCreditValue {
  readonly author: string;
  readonly license: string;
  readonly url: string;
}

/**
 * Who took a recipe's cover photo, under which licence, and where it was found.
 *
 * @remarks
 * - **What it is for.** Recipely Kitchen photos come from open collections
 *   (CC0, public domain, CC BY / BY-SA); the licence asks for the credit line
 *   under the cover, and the line links to the source page.
 * - **Validated once, here.** The link opens outside the app, so only an
 *   `http(s)` address gets in, and a credit missing its author or licence is
 *   no credit at all — the cover then simply shows none.
 * - **The licence is the server's own spelling** (`CC-BY-4.0`), shown as is.
 */
export class ImageCredit extends BaseValueObject<ImageCreditValue> {
  private constructor(value: ImageCreditValue) {
    super(value);
  }

  static create(author: string, license: string, url: string): Result<ImageCredit, ValidationFailure> {
    const value = { author: author.trim(), license: license.trim(), url: url.trim() };
    if (
      value.author.length === ValueConstants.zero ||
      value.license.length === ValueConstants.zero ||
      !RegexConstants.absoluteHttpUrl.test(value.url)
    ) {
      return fail(new ValidationFailure(DiagnosticMessage.entity.recipe.imageCreditIncomplete, FailureField.imageCredit));
    }
    return ok(new ImageCredit(value));
  }

  get author(): string {
    return this._value.author;
  }

  get license(): string {
    return this._value.license;
  }

  get url(): string {
    return this._value.url;
  }

  override equals(other: BaseValueObject<ImageCreditValue>): boolean {
    return (
      this._value.author === other.value.author &&
      this._value.license === other.value.license &&
      this._value.url === other.value.url
    );
  }

  override toString(): string {
    return [this._value.author, this._value.license].join(CharConstants.space);
  }
}
