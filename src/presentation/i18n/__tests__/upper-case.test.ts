/**
 * Reported from the profile screen: the stat labels read "BEĞENI", "GÖRÜNTÜ",
 * "KAYITLI". The first is not a Turkish word — `String.toUpperCase()` and
 * `textTransform: 'uppercase'` both map `i` to `I`, while Turkish maps it to
 * `İ` (and `ı` to `I`). Every upper-case label in the app goes through this
 * helper for that reason.
 */

import { setLocale } from '@presentation/i18n/i18n';
import { upperCase } from '@presentation/i18n/upper-case';
import { tr } from '@presentation/i18n/locales/tr';
import { LocaleConstants } from '@application/i18n/locale-constants';

describe('upperCase', () => {
  afterEach(() => {
    setLocale(LocaleConstants.en);
  });

  describe('in Turkish', () => {
    beforeEach(() => {
      setLocale(LocaleConstants.tr);
    });

    it('keeps the dot on i', () => {
      expect(upperCase('Beğeni')).toBe('BEĞENİ');
    });

    it('drops the dot from ı', () => {
      expect(upperCase('Kayıt')).toBe('KAYIT');
    });

    it('handles both letters in one word', () => {
      expect(upperCase('ısıtıcı')).toBe('ISITICI');
    });

    it('upper-cases the profile stat labels the way a Turkish reader writes them', () => {
      expect([tr.profile.recipes, tr.profile.likes, tr.profile.views, tr.profile.saved].map(upperCase))
        .toEqual(['TARİF', 'BEĞENİ', 'GÖRÜNTÜLENME', 'KAYDEDİLEN']);
    });

    it('leaves the rest of the alphabet to the default mapping', () => {
      expect(upperCase('şeker öğün çilek')).toBe('ŞEKER ÖĞÜN ÇİLEK');
    });
  });

  describe('in English', () => {
    beforeEach(() => {
      setLocale(LocaleConstants.en);
    });

    it('uses the default mapping, dotless I included', () => {
      expect(upperCase('Nutritional Info')).toBe('NUTRITIONAL INFO');
    });
  });
});
