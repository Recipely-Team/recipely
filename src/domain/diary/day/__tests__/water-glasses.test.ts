import { WaterGlasses } from '@domain/diary/day/water-glasses';

describe('WaterGlasses', () => {
  it('accepts whole glasses from 0 to 12', () => {
    expect(WaterGlasses.create(0).ok).toBe(true);
    expect(WaterGlasses.create(12).ok).toBe(true);
  });

  it('refuses a fraction or a value out of range', () => {
    expect(WaterGlasses.create(1.5).ok).toBe(false);
    expect(WaterGlasses.create(-1).ok).toBe(false);
    expect(WaterGlasses.create(13).ok).toBe(false);
  });

  it('clamps a server value into range', () => {
    expect(WaterGlasses.clamped(20).value).toBe(12);
    expect(WaterGlasses.clamped(-3).value).toBe(0);
  });

  it('knows its litres and whether a glass can be added or removed', () => {
    const six = WaterGlasses.clamped(6);
    expect(six.litres).toBe(1.5);
    expect(six.canAdd && six.canRemove).toBe(true);
    expect(WaterGlasses.clamped(12).canAdd).toBe(false);
    expect(WaterGlasses.clamped(0).canRemove).toBe(false);
  });
});
