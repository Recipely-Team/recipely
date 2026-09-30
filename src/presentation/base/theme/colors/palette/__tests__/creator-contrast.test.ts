import { contrastRatio } from '@presentation/base/theme';
import { ALL_THEMES, getThemeColors } from '@presentation/base/theme/colors/palette/themes';
import { errorSurfaces } from '@presentation/base/theme/colors/surfaces/error-surfaces';
import { SeverityType } from '@presentation/base/theme/colors/surfaces/severity-type';
import type { ThemeVariant } from '@presentation/base/theme/context/theme-variant';

/**
 * The creators UI's own pairings (design-spec.md → Creators).
 *
 * - `textSubtle` carries handles, captions and counts as body-size text on the
 *   page (`background`) and on cards (`surface`), so it holds the 4.5 floor on
 *   both, in every palette and both variants. `textMuted` did not: 4.12:1 on
 *   Pearl White's light background.
 * - The Edit Profile claim pills (pending / approved / rejected) are 12px bold
 *   labels on the warning / success / danger severity surfaces — small text,
 *   so 4.5 as well.
 */
const AA_BODY = 4.5;
const VARIANTS: ThemeVariant[] = ['light', 'dark'];
const CASES = ALL_THEMES.flatMap((id) => VARIANTS.map((variant) => ({ id, variant })));
const PILL_SEVERITIES = [SeverityType.Warning, SeverityType.Success, SeverityType.Danger] as const;

describe.each(CASES)('creators contrast — $id $variant', ({ id, variant }) => {
  const colors = getThemeColors(id, variant);

  it.each(['background', 'surface'] as const)('textSubtle reads at AA on %s', (ground) => {
    expect(contrastRatio(colors.textSubtle, colors[ground])).toBeGreaterThanOrEqual(AA_BODY);
  });

  it('textSubtle is no louder than text', () => {
    expect(contrastRatio(colors.textSubtle, colors.background)).toBeLessThanOrEqual(
      contrastRatio(colors.text, colors.background),
    );
  });

  it.each(PILL_SEVERITIES)('the %s claim pill label reads at AA on its fill', (severity) => {
    const surface = errorSurfaces(variant, colors)[severity];
    expect(contrastRatio(surface.text, surface.bg)).toBeGreaterThanOrEqual(AA_BODY);
  });
});

describe('textSubtle on Pearl White (the prototype palette)', () => {
  it('lifts the light handle grey past the 4.12:1 textMuted gives', () => {
    const light = getThemeColors('pearl-white', 'light');

    expect(contrastRatio(light.textMuted, light.background)).toBeLessThan(AA_BODY);
    expect(contrastRatio(light.textSubtle, light.background)).toBeGreaterThanOrEqual(AA_BODY);
  });
});
