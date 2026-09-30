import { contrastRatio } from '@presentation/base/theme/colors/contrast/contrast';
import { ALL_THEMES, getThemeColors } from '@presentation/base/theme/colors/palette/themes';
import { DIARY_TONES } from '@presentation/base/theme/colors/tones/diary-tones';
import { ThemeVariant } from '@presentation/base/theme/context/theme-variant';

const TEXT_FLOOR = 7;
const GRAPHIC_FLOOR = 3;
const VARIANTS = [ThemeVariant.Light, ThemeVariant.Dark];

describe('DIARY_TONES', () => {
  it.each(VARIANTS)('%s: every fg reads at 7:1 on its own bg', (variant) => {
    for (const tone of Object.values(DIARY_TONES[variant])) {
      expect(contrastRatio(tone.fg, tone.bg)).toBeGreaterThanOrEqual(TEXT_FLOOR);
    }
  });

  it.each(ALL_THEMES.flatMap((theme) => VARIANTS.map((variant) => [theme, variant] as const)))(
    '%s/%s: every solid stands out 3:1 on cardBackground and surface',
    (theme, variant) => {
      const colors = getThemeColors(theme, variant);
      for (const tone of Object.values(DIARY_TONES[variant])) {
        expect(contrastRatio(tone.solid, colors.cardBackground)).toBeGreaterThanOrEqual(GRAPHIC_FLOOR);
        expect(contrastRatio(tone.solid, colors.surface)).toBeGreaterThanOrEqual(GRAPHIC_FLOOR);
      }
    },
  );
});
