import { matchScreenLabel } from '@domain/assistant/screen/match-screen-label';

describe('matchScreenLabel', () => {
  it('prefers the exact label over one that only contains the words', () => {
    expect(matchScreenLabel(['Kaydet ve yayınla', 'Kaydet'], 'kaydet')).toBe(1);
  });

  it('finds the one label that contains what was said', () => {
    expect(matchScreenLabel(['Aylık, 0,99 $', 'Yıllık, 4,99 $'], 'yıllık')).toBe(1);
  });

  it('ignores case, Turkish dotted and dotless i, accents and spacing', () => {
    expect(matchScreenLabel(['SATIN ALIMLARI GERİ YÜKLE'], '  satın   alımları geri yükle ')).toBe(0);
    expect(matchScreenLabel(['Crème brûlée'], 'creme brulee')).toBe(0);
  });

  it('answers null rather than guessing between two labels', () => {
    expect(matchScreenLabel(['Tarifi sil', 'Yorumu sil'], 'sil')).toBeNull();
  });

  it('answers null when nothing fits or nothing was said', () => {
    expect(matchScreenLabel(['Kaydet'], 'paylaş')).toBeNull();
    expect(matchScreenLabel(['Kaydet'], '   ')).toBeNull();
  });
});
