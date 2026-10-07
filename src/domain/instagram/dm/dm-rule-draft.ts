import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import { ValidationFailure } from '@core/failure';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import { ValueConstants } from '@core/constants';
import { DmRuleLimits } from '@domain/instagram/dm/dm-rule-limits';
import { DmMessageToken } from '@domain/instagram/dm/dm-message-token';
import type { DmKeywords } from '@domain/instagram/dm/dm-keywords';
import type { DmRuleChanges } from '@domain/instagram/dm/dm-rule-changes';

/** What the editor collected. */
interface DmRuleInput {
  mediaId: string | null;
  keywords: DmKeywords;
  recipeId: string | null;
  dmText: string;
  /** Null when the public reply is off. */
  publicReplyText: string | null;
}

/**
 * A rule ready to save (POST / PATCH `/me/instagram/rules`). `validate` is the
 * editor's Save gate and each `is…Valid` its per-step Next gate, so the
 * screen can never accept what the server refuses.
 *
 * @remarks
 * - **`{link}` is required here** although the server would append it: the
 *   design makes the creator place it (spec step 4).
 */
export class DmRuleDraft {
  private constructor(
    readonly mediaId: string,
    readonly keywords: readonly string[],
    readonly recipeId: string,
    readonly dmText: string,
    readonly publicReplyText: string | null,
  ) {}

  /** The edit an existing rule takes — everything but the post, which never changes. */
  asChanges(): DmRuleChanges {
    return { keywords: this.keywords, recipeId: this.recipeId, dmText: this.dmText, publicReplyText: this.publicReplyText };
  }

  static isDmTextValid(text: string): boolean {
    return text.trim().length > ValueConstants.zero && text.length <= DmRuleLimits.DmTextMax && text.includes(DmMessageToken.Link);
  }

  /** Off (null) is valid; on, it needs 1–300 characters. */
  static isPublicReplyValid(text: string | null): boolean {
    return text === null || (text.trim().length > ValueConstants.zero && text.length <= DmRuleLimits.PublicReplyMax);
  }

  static validate(input: DmRuleInput): Result<DmRuleDraft, ValidationFailure> {
    if (input.mediaId === null) return fail(new ValidationFailure(DiagnosticMessage.instagram.mediaRequired, 'mediaId'));
    if (!input.keywords.isValid) return fail(new ValidationFailure(DiagnosticMessage.instagram.keywordsRequired, 'keywords'));
    if (input.recipeId === null) return fail(new ValidationFailure(DiagnosticMessage.instagram.recipeRequired, 'recipeId'));
    if (!DmRuleDraft.isDmTextValid(input.dmText)) return fail(new ValidationFailure(DiagnosticMessage.instagram.dmTextInvalid, 'dmText'));
    if (!DmRuleDraft.isPublicReplyValid(input.publicReplyText)) {
      return fail(new ValidationFailure(DiagnosticMessage.instagram.publicReplyInvalid, 'publicReplyText'));
    }
    return ok(
      new DmRuleDraft(input.mediaId, input.keywords.value, input.recipeId, input.dmText.trim(), input.publicReplyText?.trim() ?? null),
    );
  }
}
