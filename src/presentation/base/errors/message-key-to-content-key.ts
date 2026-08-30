import { ErrorMessageKey } from '@core/failure';
import type { FailureContentKey } from '@presentation/base/errors/failure-content-key';

/**
 * The ONLY place a backend error key is turned into user copy.
 *
 * A `code` is lossy — `errors.ai.prompt_rejected` ("we refused your prompt") and
 * `errors.ai.invalid_response` ("the AI answered with nonsense, just retry")
 * both arrive as `unprocessable` → `ValidationFailure`, and the right advice is
 * opposite. The key is what tells them apart.
 *
 * Inclusion rule: a key earns an entry here ONLY when the user's next move
 * differs from that of the coarse code bucket. Purely internal keys
 * (`errors.internal.unexpected`, `errors.ai.provider_not_configured`,
 * `errors.unauthorized.missing_token`, the per-field `errors.validation.*`
 * form errors …) are intentionally absent: they fall back to the code-tier copy,
 * which already says the only useful thing ("something went wrong on our end",
 * "check the highlighted fields"). Never invent scary technical copy for an
 * error the user cannot act on.
 *
 * Unlisted / absent keys resolve to `undefined` and the caller falls back to the
 * code — which is exactly what an older backend (no `messageKey` on the wire)
 * produces, so the fallback path is the one that must always work.
 */
export const MESSAGE_KEY_TO_CONTENT_KEY: Record<string, FailureContentKey> = {
  [ErrorMessageKey.aiPromptRejected]: 'aiPromptRejected',
  [ErrorMessageKey.aiInvalidResponse]: 'aiInvalidResponse',
  [ErrorMessageKey.aiUpstreamFailed]: 'aiUpstreamFailed',
  [ErrorMessageKey.aiCooldown]: 'aiCooldown',
  [ErrorMessageKey.promptRequired]: 'promptRequired',
  [ErrorMessageKey.promptTooLong]: 'promptTooLong',
  [ErrorMessageKey.refineInstructionRequired]: 'refineInstructionRequired',

  [ErrorMessageKey.importInvalidUrl]: 'importInvalidUrl',
  [ErrorMessageKey.importNotInstagram]: 'importNotInstagram',
  [ErrorMessageKey.importFetchFailed]: 'importFetchFailed',
  [ErrorMessageKey.importDurationExceeded]: 'importDurationExceeded',
  [ErrorMessageKey.importNoRecipeFound]: 'importNoRecipeFound',
  [ErrorMessageKey.importBusy]: 'importBusy',
  [ErrorMessageKey.recipeExists]: 'recipeExists',
  [ErrorMessageKey.photoRejected]: 'photoRejected',
  [ErrorMessageKey.photoUnchecked]: 'photoUnchecked',

  [ErrorMessageKey.emailExists]: 'emailExists',
  [ErrorMessageKey.codeInvalid]: 'codeInvalid',
  [ErrorMessageKey.codeExpired]: 'codeExpired',
  [ErrorMessageKey.codeAttemptsExceeded]: 'codeAttemptsExceeded',
  [ErrorMessageKey.codeCooldown]: 'codeCooldown',
  [ErrorMessageKey.registrationExpired]: 'registrationExpired',

  [ErrorMessageKey.invalidMediaType]: 'invalidMediaType',
  [ErrorMessageKey.invalidImageType]: 'invalidImageType',
  [ErrorMessageKey.fileTooLarge]: 'fileTooLarge',

  [ErrorMessageKey.accountDeleted]: 'accountDeleted',
  [ErrorMessageKey.resetLinkInvalid]: 'resetLinkInvalid',
  [ErrorMessageKey.resetLinkExpired]: 'resetLinkExpired',
  [ErrorMessageKey.resetLinkUsed]: 'resetLinkUsed',
  [ErrorMessageKey.passwordTooShort]: 'passwordTooShort',
};
