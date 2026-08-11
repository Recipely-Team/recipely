const appJson = require('../../app.json');

const splashOptions = () => {
  const entry = appJson.expo.plugins.find(
    (p) => Array.isArray(p) && p[0] === 'expo-splash-screen',
  );
  if (entry === undefined) throw new Error('expo-splash-screen plugin not configured');
  return entry[1];
};

/**
 * The splash is native: it is baked at build time and cannot know which of the
 * app's themes the user picked. It therefore commits to one neutral off-white
 * in BOTH appearances — a splash that changes with the device theme is the one
 * that produced the lighter-orange-square bug, because the window follows the
 * theme and the generated logo plate does not.
 */
describe('splash background', () => {
  it('is the same in light and dark', () => {
    const { backgroundColor, dark } = splashOptions();

    expect(dark.backgroundColor).toBe(backgroundColor);
  });

  it('is a light colour, so the logo plate reads against it', () => {
    const hex = splashOptions().backgroundColor;

    expect(hex).toMatch(/^#[0-9A-Fa-f]{6}$/);
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
    expect(Math.min(r, g, b)).toBeGreaterThan(0xE0);
  });
});
