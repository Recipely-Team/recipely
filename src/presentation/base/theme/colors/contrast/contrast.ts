import { CharConstants, RegexConstants, ValueConstants } from '@core/constants';
import { HexColorConstants } from '@presentation/base/theme/colors/contrast/hex-color-constants';

const parseHex = (hex: string): { r: number; g: number; b: number } => {
  if (!RegexConstants.hexColor.test(hex)) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  const body = hex.slice(ValueConstants.one);
  const expanded =
    body.length === HexColorConstants.shorthandLength
      ? body.split(CharConstants.empty).map((c) => c + c).join(CharConstants.empty)
      : body.slice(ValueConstants.zero, HexColorConstants.fullLength);
  return {
    r: parseInt(expanded.slice(...HexColorConstants.redRange), HexColorConstants.radix),
    g: parseInt(expanded.slice(...HexColorConstants.greenRange), HexColorConstants.radix),
    b: parseInt(expanded.slice(...HexColorConstants.blueRange), HexColorConstants.radix),
  };
};

const toLinear = (channel8bit: number): number => {
  const c = channel8bit / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
};

export const relativeLuminance = (hex: string): number => {
  const { r, g, b } = parseHex(hex);
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
};

/**
 * The constant in the WCAG 2.x contrast formula `(L1 + 0.05) / (L2 + 0.05)`.
 * It models the ambient light reflecting off a screen, which is why the ratio
 * tops out at 21:1 rather than infinity. Fixed by the spec — never tune it.
 */
const WCAG_AMBIENT_OFFSET = 0.05;

export const contrastRatio = (hexA: string, hexB: string): number => {
  const lA = relativeLuminance(hexA);
  const lB = relativeLuminance(hexB);
  const lighter = Math.max(lA, lB);
  const darker = Math.min(lA, lB);
  return (lighter + WCAG_AMBIENT_OFFSET) / (darker + WCAG_AMBIENT_OFFSET);
};
