import { ConflictFailure, ErrorMessageKey, ValidationFailure } from '@core/failure';
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
 * The creator tag's backend keys each resolve to their own copy: a handle the
 * user can fix, one another creator already holds, and a claim that has left
 * review (the admin path). Every catalogue
 * carries the words, since the Edit Profile form shows them in any locale.
 */
const CASES = [
  [new ValidationFailure('bad handle', 'handle', ErrorMessageKey.creatorHandleInvalid), 'creatorHandleInvalid'],
  [new ConflictFailure('taken', 'handle', ErrorMessageKey.creatorHandleTaken), 'creatorHandleTaken'],
  [new ConflictFailure('moved on', undefined, ErrorMessageKey.creatorNotPending), 'creatorNotPending'],
] as const;

const CATALOGUES = { en, tr, ar, de, es, fr, hi, id, it: itLocale, ja, ko, pt, ru, zh };

describe('creator failure copy', () => {
  afterEach(() => setLocale(LocaleConstants.en));

  it.each(CASES)('%p resolves to its own English and Turkish copy', (failure, contentKey) => {
    setLocale(LocaleConstants.en);
    expect(failureContent(failure)).toEqual({ title: en.errors[contentKey].title, body: en.errors[contentKey].body });
    setLocale(LocaleConstants.tr);
    expect(failureContent(failure)).toEqual({ title: tr.errors[contentKey].title, body: tr.errors[contentKey].body });
  });

  it.each(Object.entries(CATALOGUES))('%s carries every creator error key', (_locale, catalogue) => {
    for (const [, contentKey] of CASES) {
      const entry = catalogue.errors[contentKey];
      expect([entry.title, entry.body, entry.short].every((s) => s.trim().length > 0)).toBe(true);
    }
  });
});
