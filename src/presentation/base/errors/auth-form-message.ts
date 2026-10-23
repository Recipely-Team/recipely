import type { TranslationsType } from '@presentation/i18n';
import type { Failure } from '@presentation/base/types';
import {
  failureKeyMessage,
  failureToastMessage,
} from '@presentation/base/errors/failure-lookups';

/**
 * Resolves the message for an auth form banner. Three tiers, most specific first:
 *
 * 1. the failure's `messageKey`, when the backend catalogue names this exact
 *    error and we wrote copy for it. It is strictly more specific than anything
 *    the screen can infer from the class: an expired verification code and a
 *    wrong one are both `validation`, and a sign-in blocked because the account
 *    was deleted is `unauthorized` — same as an expired session.
 * 2. the screen's `overrides`, keyed by failure `code`. The same class means
 *    something different per endpoint — a 401 on sign-in is "wrong password",
 *    not "session expired"; a 409 on register is "email taken". This is what an
 *    older backend (no `messageKey` on the wire) still falls back to.
 * 3. the generic class-based copy, for anything unmapped (network, timeout,
 *    server).
 */
export const authFormMessage = (
  t: TranslationsType,
  failure: Failure,
  overrides: Partial<Record<string, string>>,
): string =>
  failureKeyMessage(t, failure) ?? overrides[failure.code] ?? failureToastMessage(t, failure);
