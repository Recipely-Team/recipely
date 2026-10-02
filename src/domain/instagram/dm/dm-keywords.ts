import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import { ValidationFailure } from '@core/failure';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import { CharConstants, ValueConstants } from '@core/constants';
import { BaseValueObject } from '@core/value-object/base-value-object';
import { DmRuleLimits } from '@domain/instagram/dm/dm-rule-limits';

const WHITESPACE_RUN = /\s+/g;

/**
 * A rule's trigger words (Instagram automations spec, step 2): lower-cased,
 * trimmed, inner whitespace collapsed, no repeats, up to ten of up to forty
 * characters. A comment matches when it contains any of them.
 *
 * @remarks
 * - **`with` refuses rather than clamps**, so the field can say why.
 * - **Matching folds case with the reader's locale** — Turkish `İ` is `i`.
 */
export class DmKeywords extends BaseValueObject<readonly string[]> {
  private constructor(words: readonly string[]) {
    super(words);
  }

  static empty(): DmKeywords {
    return new DmKeywords([]);
  }

  /** Words read back from the server, normalised the same way; unusable ones are dropped. */
  static of(words: readonly string[]): DmKeywords {
    return words.reduce((all, word) => {
      const next = all.with(word);
      return next.ok ? next.value : all;
    }, DmKeywords.empty());
  }

  static normalize(raw: string): string {
    return raw.trim().replace(WHITESPACE_RUN, CharConstants.space).toLocaleLowerCase();
  }

  get count(): number {
    return this._value.length;
  }

  get isFull(): boolean {
    return this._value.length >= DmRuleLimits.KeywordsMax;
  }

  /** At least one word — the rule's minimum. */
  get isValid(): boolean {
    return this._value.length >= DmRuleLimits.KeywordsMin;
  }

  /** Adds a word; an empty, too-long or eleventh word fails, a repeat is a no-op. */
  with(raw: string): Result<DmKeywords, ValidationFailure> {
    const word = DmKeywords.normalize(raw);
    if (word.length === ValueConstants.zero || word.length > DmRuleLimits.KeywordMaxLength) {
      return fail(new ValidationFailure(DiagnosticMessage.instagram.keywordInvalid, 'keywords'));
    }
    if (this._value.includes(word)) return ok(this);
    if (this.isFull) return fail(new ValidationFailure(DiagnosticMessage.instagram.tooManyKeywords, 'keywords'));
    return ok(new DmKeywords([...this._value, word]));
  }

  without(word: string): DmKeywords {
    return new DmKeywords(this._value.filter((w) => w !== word));
  }

  /** The first word the comment contains, case folded with `locale`; null when none. */
  matchIn(comment: string, locale: string): string | null {
    const text = comment.toLocaleLowerCase(locale);
    return this._value.find((word) => text.includes(word.toLocaleLowerCase(locale))) ?? null;
  }

  override equals(other: DmKeywords): boolean {
    return this._value.length === other.value.length && this._value.every((word, i) => word === other.value[i]);
  }
}
