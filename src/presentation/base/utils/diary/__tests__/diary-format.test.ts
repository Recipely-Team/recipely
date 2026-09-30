import { nutrientsOf } from '@domain/diary/__fixtures__/nutrients-of';
import { LocaleConstants } from '@application/i18n/locale-constants';
import { setLocale } from '@presentation/i18n';
import { parseDecimalInput } from '@presentation/base/utils/diary/parse-decimal-input';
import { formatMacroLine } from '@presentation/base/utils/diary/format-macro-line';
import { formatServings } from '@presentation/base/utils/diary/format-servings';
import { formatWholeNumber } from '@presentation/base/utils/diary/format-whole-number';
import { formatOneDecimal } from '@presentation/base/utils/diary/format-one-decimal';

describe('diary formatting', () => {
  afterEach(() => setLocale(LocaleConstants.en));

  it('reads a decimal comma, an empty field as null and junk as NaN', () => {
    expect(parseDecimalInput('1,5')).toBe(1.5);
    expect(parseDecimalInput(' 20 ')).toBe(20);
    expect(parseDecimalInput('')).toBeNull();
    expect(parseDecimalInput('abc')).toBeNaN();
  });

  it('spells numbers per locale', () => {
    expect(formatWholeNumber(1429.4, 'tr')).toBe('1.429');
    expect(formatWholeNumber(1429.4, 'en')).toBe('1,429');
    expect(formatOneDecimal(1.25, 'tr')).toBe('1,3');
  });

  it('drops the macro line for a calories-only food and skips unknown macros', () => {
    setLocale(LocaleConstants.en);
    expect(formatMacroLine(nutrientsOf({ calories: 300 }), 'en')).toBeNull();
    expect(formatMacroLine(nutrientsOf({ calories: 300, protein: 20.4, fat: 10 }), 'en')).toBe('P 20 g · F 10 g');
  });

  it('says one serving in the singular', () => {
    setLocale(LocaleConstants.en);
    expect(formatServings(1, 'en')).toBe('1 serving');
    expect(formatServings(1.5, 'en')).toBe('1.5 servings');
  });
});
