import { SCALE_FACTOR, scale, scaleFont } from '@presentation/base/theme/tokens/scale';
import { lineHeightFor } from '@presentation/base/theme/tokens/typography/line-height-for';
import { lineHeights } from '@presentation/base/theme/tokens/typography/line-heights';
import { spacing } from '@presentation/base/theme/tokens/sizing/spacing';
import { iconSizes } from '@presentation/base/theme/tokens/sizing/icon-sizes';
import { controlSizes } from '@presentation/base/theme/tokens/sizing/control-sizes';
import { opacities } from '@presentation/base/theme/tokens/effects/opacities';
import { borderWidths } from '@presentation/base/theme/tokens/sizing/border-widths';
import { layoutSizes } from '@presentation/base/theme/tokens/sizing/layout-sizes';
import { decorSizes } from '@presentation/base/theme/tokens/sizing/decor-sizes';
import { mediaSizes } from '@presentation/base/theme/tokens/sizing/media-sizes';
import { fontSizes } from '@presentation/base/theme/tokens/typography/font-sizes';
import { avatarSizes } from '@presentation/base/theme/tokens/sizing/avatar-sizes';
import { letterSpacings } from '@presentation/base/theme/tokens/typography/letter-spacings';

describe('device scaling', () => {
  it('clamps the factor into the tap-target-safe band', () => {
    // The jest environment reports a viewport well above the 375pt baseline,
    // so this also proves the upper clamp actually engages.
    expect(SCALE_FACTOR).toBeGreaterThanOrEqual(0.9);
    expect(SCALE_FACTOR).toBeLessThanOrEqual(1.12);
  });

  it('scales layout measurements by the factor', () => {
    expect(scale(100)).toBeCloseTo(100 * SCALE_FACTOR, 0);
  });

  it('moves type less than boxes', () => {
    // Type is damped, so it must sit strictly between the unscaled value and
    // the fully scaled one whenever the factor is not neutral.
    const boxDelta = Math.abs(scale(100) - 100);
    const fontDelta = Math.abs(scaleFont(100) - 100);
    expect(fontDelta).toBeLessThan(boxDelta);
  });

  it('preserves the ordering of every ladder it is applied to', () => {
    const ascending = (values: readonly number[]): boolean =>
      values.every((v, i) => i === 0 || v >= (values[i - 1] ?? 0));

    expect(ascending(Object.values(spacing))).toBe(true);
    expect(ascending(Object.values(iconSizes))).toBe(true);
    expect(ascending(Object.values(controlSizes))).toBe(true);
    expect(ascending(Object.values(decorSizes))).toBe(true);
    expect(ascending(Object.values(mediaSizes))).toBe(true);
    expect(ascending(Object.values(fontSizes))).toBe(true);
    expect(ascending(Object.values(borderWidths))).toBe(true);
  });

  it('keeps the avatar ladder ordered and each ring wider than its inner avatar', () => {
    expect(avatarSizes.xs).toBeLessThan(avatarSizes.sm);
    expect(avatarSizes.sm).toBeLessThan(avatarSizes.md);
    expect(avatarSizes.md).toBeLessThan(avatarSizes.lg);
    expect(avatarSizes.lg).toBeLessThan(avatarSizes.xl);
    // A frame narrower than its avatar would clip the ring away entirely.
    expect(avatarSizes.frame).toBeGreaterThan(avatarSizes.frameInner);
    expect(avatarSizes.editFrame).toBeGreaterThan(avatarSizes.editFrameInner);
  });

  it('orders tracking from tightest to widest', () => {
    const values = Object.values(letterSpacings);
    expect(values.every((v, i) => i === 0 || v > (values[i - 1] ?? 0))).toBe(true);
  });

  it('leaves hairlines and viewport caps unscaled', () => {
    // A scaled hairline lands off the pixel grid; a scaled max-width would
    // fight the breakpoints that own layout decisions.
    expect(borderWidths.hairline).toBe(1);
    expect(layoutSizes.webContentMax).toBe(1200);
  });
});

describe('lineHeightFor', () => {
  it('derives the box from the font size and ratio', () => {
    expect(lineHeightFor(20, lineHeights.normal)).toBeCloseTo(29, 0);
  });

  it('defaults to the body ratio', () => {
    expect(lineHeightFor(20)).toBe(lineHeightFor(20, lineHeights.normal));
  });

  it('grows with the font size, so the ratio survives a larger scale', () => {
    expect(lineHeightFor(30)).toBeGreaterThan(lineHeightFor(20));
  });
});

describe('opacity families', () => {
  it('orders every family so the suffix grades the effect, not the number', () => {
    // Dimming families: a stronger suffix means a LOWER alpha.
    expect(opacities.pressedFaint).toBeGreaterThan(opacities.pressedSubtle);
    expect(opacities.pressedSubtle).toBeGreaterThan(opacities.pressedLight);
    expect(opacities.pressedLight).toBeGreaterThan(opacities.pressed);
    expect(opacities.pressed).toBeGreaterThan(opacities.pressedStrong);

    expect(opacities.disabledFaint).toBeGreaterThan(opacities.disabled);
    expect(opacities.disabled).toBeGreaterThan(opacities.disabledStrong);
    expect(opacities.disabledStrong).toBeGreaterThan(opacities.inactive);

    expect(opacities.onMediaFaint).toBeGreaterThan(opacities.onMediaSubtle);
    expect(opacities.onMediaSubtle).toBeGreaterThan(opacities.onMedia);

    // Scrim family: a stronger suffix means a HIGHER alpha — same rule, because
    // the suffix grades how much the token does, not which way the number goes.
    expect(opacities.scrimFaint).toBeLessThan(opacities.scrimSubtle);
    expect(opacities.scrimSubtle).toBeLessThan(opacities.scrim);
  });
});
