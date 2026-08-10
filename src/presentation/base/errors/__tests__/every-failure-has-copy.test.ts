import { FailureCode } from '@core/failure/failure-code';
import { ErrorMessageKey } from '@core/failure/error-message-key';
import { UnknownFailure } from '@core/failure';
import { failureContent } from '@presentation/base/errors/failure-lookups';
import { setLocale } from '@presentation/i18n';
import { LocaleConstants } from '@application/i18n/locale-constants';

/**
 * A failure the user cannot read is a failure they cannot act on. Two ways that
 * happened before: a code with no row in the copy table (it fell through to the
 * generic "something went wrong"), and a backend `messageKey` whose dedicated
 * copy existed in one language only.
 *
 * `CODE_TO_KEY` is now `Record<FailureCode, …>`, so the first is a compile
 * error. These cover what the compiler cannot see: that the resolved key
 * actually has words behind it, in every language we ship.
 */

const LOCALES = [LocaleConstants.en, LocaleConstants.tr] as const;

const failureWith = (code: FailureCode, messageKey?: string): UnknownFailure => {
  const failure = new UnknownFailure('diagnostic', undefined, messageKey);
  Object.defineProperty(failure, 'code', { value: code });
  return failure;
};

describe.each(LOCALES)('failure copy in %s', (locale) => {
  beforeEach(() => {
    setLocale(locale);
  });

  it.each(Object.values(FailureCode))('%s has a title and a body', (code) => {
    const content = failureContent(failureWith(code));

    expect(content.title.trim().length).toBeGreaterThan(0);
    expect(content.body.trim().length).toBeGreaterThan(0);
  });

  it.each(Object.values(ErrorMessageKey))('message key %s has a title and a body', (key) => {
    const content = failureContent(failureWith(FailureCode.Unknown, key));

    expect(content.title.trim().length).toBeGreaterThan(0);
    expect(content.body.trim().length).toBeGreaterThan(0);
  });
});
