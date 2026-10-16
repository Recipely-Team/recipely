import { SourcePlatform } from '@domain/recipes/provenance/source-platform';
import { importLookFor } from '@presentation/app/import-recipe/model/import-look-for';
import { getThemeColors } from '@presentation/base/theme/colors/palette/themes';
import { contrastRatio } from '@presentation/base/theme/colors/contrast/contrast';
import { BrandColors } from '@presentation/base/theme';

/**
 * The Pinterest look from the prototype's "Pinterest Import" board: a two-stop
 * red ring and a pill on the deep stop, because white on the brand red alone
 * measures 4.79:1 and the pill's text is small.
 */
describe('importLookFor · Pinterest', () => {
  it.each(['light', 'dark'] as const)('draws the two-stop red ring in %s mode', (mode) => {
    const look = importLookFor(SourcePlatform.Pinterest, getThemeColors('pearl-white', mode));
    expect(look.gradient).toEqual([BrandColors.pinterestInk, BrandColors.pinterestDeep]);
    expect(look.accent).toBe(BrandColors.pinterestInk);
  });

  it('keeps the pill text at AA for small text', () => {
    const look = importLookFor(SourcePlatform.Pinterest, getThemeColors('pearl-white', 'light'));
    for (const stop of look.pill) expect(contrastRatio(look.pillText, stop)).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps the seal ink at 3:1 on the seal’s white face', () => {
    expect(contrastRatio(BrandColors.pinterestInk, BrandColors.white)).toBeGreaterThanOrEqual(3);
  });
});
