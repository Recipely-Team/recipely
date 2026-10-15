/**
 * The onboarding promised "1000+ recipes" and "thousands of tried recipes" in
 * every language while the app held a few dozen. The first thing a new user
 * reads must be something the app does, not a number it does not have. A
 * count on these slides needs a source; until one exists, no digit appears.
 */

import { ar } from '@presentation/i18n/locales/ar';
import { de } from '@presentation/i18n/locales/de';
import { en } from '@presentation/i18n/locales/en';
import { es } from '@presentation/i18n/locales/es';
import { fr } from '@presentation/i18n/locales/fr';
import { hi } from '@presentation/i18n/locales/hi';
import { id } from '@presentation/i18n/locales/id';
import { it as itLocale } from '@presentation/i18n/locales/it';
import { ja } from '@presentation/i18n/locales/ja';
import { ko } from '@presentation/i18n/locales/ko';
import { pt } from '@presentation/i18n/locales/pt';
import { ru } from '@presentation/i18n/locales/ru';
import { tr } from '@presentation/i18n/locales/tr';
import { zh } from '@presentation/i18n/locales/zh';

const LOCALES = { ar, de, en, es, fr, hi, id, it: itLocale, ja, ko, pt, ru, tr, zh };
/** Any digit, ASCII or not (Devanagari, Arabic-Indic, full-width). */
const DIGIT = /\p{Nd}/u;

describe('onboarding slides make no numeric claims', () => {
  it.each(Object.entries(LOCALES))('%s: no slide text carries a count', (_locale, catalogue) => {
    const slides = Object.values(catalogue.onboarding.slides).filter((v): v is string => typeof v === 'string');
    expect(slides.length).toBeGreaterThan(0);
    expect(slides.filter((text) => DIGIT.test(text))).toEqual([]);
  });
});
