import { ErrorMessageKey, NotFoundFailure, ValidationFailure } from '@core/failure';
import { failureContent } from '@presentation/base/errors/failure-lookups';
import { setLocale } from '@presentation/i18n';
import { LocaleConstants } from '@application/i18n/locale-constants';
import { en } from '@presentation/i18n/locales/en';
import { tr } from '@presentation/i18n/locales/tr';
import { ar } from '@presentation/i18n/locales/ar';
import { de } from '@presentation/i18n/locales/de';
import { es } from '@presentation/i18n/locales/es';
import { fr } from '@presentation/i18n/locales/fr';
import { hi } from '@presentation/i18n/locales/hi';
import { id } from '@presentation/i18n/locales/id';
import { it as itLocale } from '@presentation/i18n/locales/it';
import { ja } from '@presentation/i18n/locales/ja';
import { ko } from '@presentation/i18n/locales/ko';
import { pt } from '@presentation/i18n/locales/pt';
import { ru } from '@presentation/i18n/locales/ru';
import { zh } from '@presentation/i18n/locales/zh';

/**
 * The food diary's actionable keys each resolve to their own copy — an entry
 * deleted elsewhere, a name, a number or a goal the user can fix — and every
 * catalogue carries the words. The diary's other keys (date, month, meal,
 * limit, water, servings) are client mistakes the user cannot act on, so they
 * fall back to the code tier by design.
 */
const CASES = [
  [new NotFoundFailure('gone', ErrorMessageKey.diaryEntryNotFound), 'diaryEntryNotFound'],
  [new ValidationFailure('long', 'name', ErrorMessageKey.diaryFoodNameTooLong), 'diaryFoodNameTooLong'],
  [new ValidationFailure('high', 'calories', ErrorMessageKey.diaryNutrientInvalid), 'diaryNutrientInvalid'],
  [new ValidationFailure('range', 'calories', ErrorMessageKey.diaryGoalInvalid), 'diaryGoalInvalid'],
] as const;

const CATALOGUES = { en, tr, ar, de, es, fr, hi, id, it: itLocale, ja, ko, pt, ru, zh };

describe('diary failure copy', () => {
  afterEach(() => setLocale(LocaleConstants.en));

  it.each(CASES)('%p resolves to its own English and Turkish copy', (failure, contentKey) => {
    setLocale(LocaleConstants.en);
    expect(failureContent(failure)).toEqual({ title: en.errors[contentKey].title, body: en.errors[contentKey].body });
    setLocale(LocaleConstants.tr);
    expect(failureContent(failure)).toEqual({ title: tr.errors[contentKey].title, body: tr.errors[contentKey].body });
  });

  it.each(Object.entries(CATALOGUES))('%s carries every diary error key', (_locale, catalogue) => {
    for (const [, contentKey] of CASES) {
      const entry = catalogue.errors[contentKey];
      expect([entry.title, entry.body, entry.short].every((s) => s.trim().length > 0)).toBe(true);
    }
  });
});
