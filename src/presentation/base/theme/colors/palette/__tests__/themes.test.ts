import { contrastRatio, relativeLuminance } from '@presentation/base/theme';
import { ALL_THEMES, getThemeColors } from '@presentation/base/theme/colors/palette/themes';
import type { ThemeColors } from '@presentation/base/theme/colors/palette/theme-colors';
import type { ThemeId } from '@presentation/base/theme/context/theme-id';
import type { ThemeVariant } from '@presentation/base/theme/context/theme-variant';

interface ContrastPair {
  label: string;
  fg: keyof ThemeColors;
  bg: keyof ThemeColors;
  minRatio: number;
}

const CONTRAST_PAIRS: ContrastPair[] = [
  { label: 'text vs background', fg: 'text', bg: 'background', minRatio: 4.5 },
  { label: 'primaryText vs primary', fg: 'primaryText', bg: 'primary', minRatio: 4.5 },
  { label: 'secondaryText vs secondary', fg: 'secondaryText', bg: 'secondary', minRatio: 4.5 },
  { label: 'chipText vs chipBackground', fg: 'chipText', bg: 'chipBackground', minRatio: 3.0 },
  { label: 'tabBarActive vs tabBarBackground', fg: 'tabBarActive', bg: 'tabBarBackground', minRatio: 3.0 },
  { label: 'textMuted vs background', fg: 'textMuted', bg: 'background', minRatio: 3.0 },
  { label: 'onSuccess vs success', fg: 'onSuccess', bg: 'success', minRatio: 4.5 },
];

const VARIANTS: ThemeVariant[] = ['light', 'dark'];

const stripAlpha = (hex: string): string => {
  if (hex.startsWith('#') && hex.length === 9) return hex.slice(0, 7);
  return hex;
};

const RGBA_PATTERN = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/;

const parseRgba = (s: string): { r: number; g: number; b: number; a: number } => {
  const m = RGBA_PATTERN.exec(s);
  if (!m) throw new Error(`Invalid rgba: ${s}`);
  return {
    r: Number(m[1]),
    g: Number(m[2]),
    b: Number(m[3]),
    a: m[4] === undefined ? 1 : Number(m[4]),
  };
};

const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const body = hex.startsWith('#') ? hex.slice(1, 7) : hex.slice(0, 6);
  return {
    r: parseInt(body.slice(0, 2), 16),
    g: parseInt(body.slice(2, 4), 16),
    b: parseInt(body.slice(4, 6), 16),
  };
};

const toHex2 = (n: number): string => Math.round(n).toString(16).padStart(2, '0');

const compositeOverHex = (overlayRgba: string, baseHex: string): string => {
  const o = parseRgba(overlayRgba);
  const b = hexToRgb(baseHex);
  const r = o.a * o.r + (1 - o.a) * b.r;
  const g = o.a * o.g + (1 - o.a) * b.g;
  const bl = o.a * o.b + (1 - o.a) * b.b;
  return `#${toHex2(r)}${toHex2(g)}${toHex2(bl)}`;
};

type HueFamily = 'r' | 'g' | 'b' | 'gray';

const hueFamily = (hex: string): HueFamily => {
  const { r, g, b } = hexToRgb(stripAlpha(hex));
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max - min < 8) return 'gray';
  if (r === max) return 'r';
  if (g === max) return 'g';
  return 'b';
};

const SIBLING_LUMINANCE_DELTA = 0.0015;

describe('themes — backgrounds are distinct (regression)', () => {
  it.each(VARIANTS)('%s themes use a variety of background colors', (variant) => {
    const backgrounds = ALL_THEMES.map((id) => getThemeColors(id, variant).background);
    const distinct = new Set(backgrounds);

    // Palette was trimmed to 4 maximally-distinct hues (blue/red/green/purple)
    // — every background should be unique, not just "mostly" distinct.
    expect(backgrounds).toHaveLength(4);
    expect(distinct.size).toBe(4);
  });

  it('dark themes do not all share #0B0B0D', () => {
    const darkBackgrounds = ALL_THEMES.map((id) => getThemeColors(id, 'dark').background);
    const sharedSlate = darkBackgrounds.filter((bg) => bg.toUpperCase() === '#0B0B0D');

    expect(sharedSlate.length).toBeLessThan(darkBackgrounds.length);
  });

  it('light themes do not all share #FFFFFF', () => {
    const lightBackgrounds = ALL_THEMES.map((id) => getThemeColors(id, 'light').background);
    const sharedWhite = lightBackgrounds.filter((bg) => bg.toUpperCase() === '#FFFFFF');

    expect(sharedWhite.length).toBeLessThan(lightBackgrounds.length);
  });
});

const themeVariantCases: { id: ThemeId; variant: ThemeVariant }[] = ALL_THEMES.flatMap((id) =>
  VARIANTS.map((variant) => ({ id, variant })),
);

describe.each(themeVariantCases)('themes — WCAG contrast — $id $variant', ({ id, variant }) => {
  const colors = getThemeColors(id, variant);

  it.each(CONTRAST_PAIRS)('$label meets ratio >= $minRatio', ({ fg, bg, minRatio }) => {
    const fgHex = stripAlpha(colors[fg]);
    const bgHex = stripAlpha(colors[bg]);
    const ratio = contrastRatio(fgHex, bgHex);

    if (ratio < minRatio) {
      throw new Error(
        `${id} ${variant}: ${fg} (${fgHex}) vs ${bg} (${bgHex}) = ${ratio.toFixed(2)}, expected >= ${minRatio}`,
      );
    }
    expect(ratio).toBeGreaterThanOrEqual(minRatio);
  });
});

describe.each(themeVariantCases)('themes — onOverlay over photo backdrop — $id $variant', ({ id, variant }) => {
  const colors = getThemeColors(id, variant);
  const onOverlay = stripAlpha(colors.onOverlay);

  it('onOverlay reads against overlay over white photo pixel', () => {
    const composed = compositeOverHex(colors.overlay, '#FFFFFF');
    const ratio = contrastRatio(onOverlay, composed);

    if (ratio < 4.5) {
      throw new Error(
        `${id} ${variant}: onOverlay (${onOverlay}) vs overlay-on-white (${composed}) = ${ratio.toFixed(2)}, expected >= 4.5`,
      );
    }
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it('onOverlay reads against overlay over black photo pixel', () => {
    const composed = compositeOverHex(colors.overlay, '#000000');
    const ratio = contrastRatio(onOverlay, composed);

    if (ratio < 4.5) {
      throw new Error(
        `${id} ${variant}: onOverlay (${onOverlay}) vs overlay-on-black (${composed}) = ${ratio.toFixed(2)}, expected >= 4.5`,
      );
    }
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });
});

describe('themes — palette-wide distinctness (regression)', () => {
  // Trimmed to 4 themes chosen specifically to sit in different hue families
  // (blue / red / green / purple) — every pair, not just curated "siblings",
  // must read as visually distinct.
  for (const variant of VARIANTS) {
    for (let i = 0; i < ALL_THEMES.length; i += 1) {
      for (let j = i + 1; j < ALL_THEMES.length; j += 1) {
        const a = ALL_THEMES[i];
        const b = ALL_THEMES[j];
        it(`${variant}: ${a} vs ${b} are visually distinct`, () => {
          const aBg = stripAlpha(getThemeColors(a, variant).background);
          const bBg = stripAlpha(getThemeColors(b, variant).background);
          const lumA = relativeLuminance(aBg);
          const lumB = relativeLuminance(bBg);
          const lumDelta = Math.abs(lumA - lumB);
          const hueA = hueFamily(aBg);
          const hueB = hueFamily(bBg);
          const distinct = lumDelta >= SIBLING_LUMINANCE_DELTA || hueA !== hueB;

          if (!distinct) {
            throw new Error(
              `${a} ${variant} (${aBg} L=${lumA.toFixed(4)} ${hueA}-dominant) and ${b} ${variant} (${bBg} L=${lumB.toFixed(4)} ${hueB}-dominant): same luminance AND same hue family — visually identical`,
            );
          }
          expect(distinct).toBe(true);
        });
      }
    }
  }
});

describe('contrast — relativeLuminance', () => {
  it('returns ~1 for white', () => {
    const lum = relativeLuminance('#FFFFFF');

    expect(lum).toBeCloseTo(1, 5);
  });

  it('returns ~0 for black', () => {
    const lum = relativeLuminance('#000000');

    expect(lum).toBeCloseTo(0, 5);
  });

  it('parses #RGB short form by doubling each channel', () => {
    const short = relativeLuminance('#FFF');
    const long = relativeLuminance('#FFFFFF');

    expect(short).toBeCloseTo(long, 10);
  });

  it('parses #RRGGBBAA by ignoring the alpha channel', () => {
    const withAlpha = relativeLuminance('#FFFFFF80');
    const noAlpha = relativeLuminance('#FFFFFF');

    expect(withAlpha).toBeCloseTo(noAlpha, 10);
  });

  it('throws on malformed hex input', () => {
    expect(() => relativeLuminance('white')).toThrow();
    expect(() => relativeLuminance('#GGGGGG')).toThrow();
    expect(() => relativeLuminance('#1234')).toThrow();
  });
});

describe('contrast — contrastRatio', () => {
  it('returns 21 for black on white', () => {
    const ratio = contrastRatio('#000000', '#FFFFFF');

    expect(ratio).toBeCloseTo(21, 1);
  });

  it('returns 1 for identical colors', () => {
    const ratio = contrastRatio('#FFFFFF', '#FFFFFF');

    expect(ratio).toBeCloseTo(1, 5);
  });

  it('returns 1 for identical mid-grey colors', () => {
    const ratio = contrastRatio('#808080', '#808080');

    expect(ratio).toBeCloseTo(1, 5);
  });

  it('is symmetric in its arguments', () => {
    const samples: [string, string][] = [
      ['#3B82F6', '#FFFFFF'],
      ['#0F172A', '#F1F5F9'],
      ['#FB7185', '#1A0008'],
      ['#FDE047', '#1A1500'],
    ];

    for (const [a, b] of samples) {
      expect(contrastRatio(a, b)).toBeCloseTo(contrastRatio(b, a), 10);
    }
  });
});
