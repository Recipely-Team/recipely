import { ErrorMessageKey, ValidationFailure } from '@core/failure';
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
 * The file import's five backend keys each resolve to their own copy — not to
 * the coarse "check your input" a `ValidationFailure` falls back to — and every
 * catalogue carries the words.
 */
const CASES = [
  [ErrorMessageKey.importNoFile, 'importNoFile'],
  [ErrorMessageKey.importUnsupportedFile, 'importUnsupportedFile'],
  [ErrorMessageKey.importTooManyFiles, 'importTooManyFiles'],
  [ErrorMessageKey.importNoRecipeInFile, 'importNoRecipeInFile'],
  [ErrorMessageKey.importUnreadableFile, 'importUnreadableFile'],
] as const;

const CATALOGUES = { en, tr, ar, de, es, fr, hi, id, it: itLocale, ja, ko, pt, ru, zh };

describe('file import failure copy', () => {
  afterEach(() => setLocale(LocaleConstants.en));

  it.each(CASES)('%s resolves to its own English and Turkish copy', (wireKey, contentKey) => {
    const failure = new ValidationFailure('refused', 'files', wireKey);

    setLocale(LocaleConstants.en);
    expect(failureContent(failure)).toEqual({ title: en.errors[contentKey].title, body: en.errors[contentKey].body });
    setLocale(LocaleConstants.tr);
    expect(failureContent(failure)).toEqual({ title: tr.errors[contentKey].title, body: tr.errors[contentKey].body });
  });

  it.each(Object.entries(CATALOGUES))('%s carries every file import key and screen string', (_locale, catalogue) => {
    for (const [, contentKey] of CASES) {
      const entry = catalogue.errors[contentKey];
      expect([entry.title, entry.body, entry.short].every((s) => s.trim().length > 0)).toBe(true);
    }
    expect(Object.keys(catalogue.fileImport).sort()).toEqual(Object.keys(en.fileImport).sort());
  });
});
