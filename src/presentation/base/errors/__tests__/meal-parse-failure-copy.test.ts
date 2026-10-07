import { ErrorMessageKey, NetworkFailure, RateLimitFailure, ServerFailure, ValidationFailure } from '@core/failure';
import { failureContent, failureSeverity } from '@presentation/base/errors/failure-lookups';
import { mealFailureContent } from '@presentation/base/widgets/diary/add-food/meal/state/meal-failure-content';
import { mealFailureActionFor } from '@presentation/base/widgets/diary/add-food/meal/state/meal-failure-action-for';
import { MealFailureAction } from '@presentation/base/widgets/diary/add-food/meal/state/meal-failure-action';
import { setLocale } from '@presentation/i18n';
import { LocaleConstants } from '@application/i18n/locale-constants';
import { en } from '@presentation/i18n/locales/en';
import { tr } from '@presentation/i18n/locales/tr';

/** Every meal-parse key the backend sends, the copy it reads as, and the one action the panel offers. */
const CASES = [
  [new ValidationFailure('x', 'text', ErrorMessageKey.mealParseInputRequired), 'mealParseInputRequired', MealFailureAction.Edit],
  [new ValidationFailure('x', 'text', ErrorMessageKey.mealParseTextTooLong), 'mealParseTextTooLong', MealFailureAction.Edit],
  [new ValidationFailure('x', 'photo', ErrorMessageKey.mealParseUnsupportedPhoto), 'mealParseUnsupportedPhoto', MealFailureAction.Edit],
  [new ValidationFailure('x', 'photo', ErrorMessageKey.mealParsePhotoRejected), 'mealParsePhotoRejected', MealFailureAction.Edit],
  [new ServerFailure('x', 503, ErrorMessageKey.mealParsePhotoUnchecked), 'mealParsePhotoUnchecked', MealFailureAction.Retry],
  [new RateLimitFailure('x', undefined, ErrorMessageKey.mealParseQuotaExceeded), 'mealParseQuotaExceeded', MealFailureAction.None],
  [new ServerFailure('x', 503, ErrorMessageKey.mealParseUnavailable), 'mealParseUnavailable', MealFailureAction.None],
  [new ValidationFailure('x', 'text', ErrorMessageKey.contentBlocked), 'contentBlocked', MealFailureAction.Edit],
  [new RateLimitFailure('x', 60, ErrorMessageKey.aiCooldown), 'aiCooldown', MealFailureAction.Retry],
] as const;

describe('meal-parse failure copy', () => {
  afterEach(() => setLocale(LocaleConstants.en));

  it.each(CASES)('%p reads as its own copy in English and Turkish, with the right action', (failure, contentKey, action) => {
    setLocale(LocaleConstants.en);
    expect(mealFailureContent(failure)).toEqual({ title: en.errors[contentKey].title, body: en.errors[contentKey].body });
    setLocale(LocaleConstants.tr);
    expect(mealFailureContent(failure)).toEqual({ title: tr.errors[contentKey].title, body: tr.errors[contentKey].body });
    expect(mealFailureActionFor(failure)).toBe(action);
  });

  it('reads a server without an AI provider as "unavailable" in the meal panel only, offering nothing to retry', () => {
    const failure = new ServerFailure('x', 503, ErrorMessageKey.aiProviderNotConfigured);
    expect(mealFailureContent(failure).title).toBe(en.errors.mealParseUnavailable.title);
    expect(failureContent(failure).title).not.toBe(en.errors.mealParseUnavailable.title);
    expect(mealFailureActionFor(failure)).toBe(MealFailureAction.None);
  });

  it('offers a retry for a dropped connection, and the daily limit is a warning, not an error', () => {
    expect(mealFailureActionFor(new NetworkFailure('offline'))).toBe(MealFailureAction.Retry);
    expect(failureSeverity(new RateLimitFailure('x', undefined, ErrorMessageKey.mealParseQuotaExceeded))).toBe('warning');
  });
});
