import { DarkTheme, DefaultTheme } from '@react-navigation/native';
import { navigationTheme } from '@presentation/navigation/navigation-theme';
import { getThemeColors } from '@presentation/base/theme/colors/palette/themes';

/**
 * The bug: opening a recipe from a bottom-tab screen flashed black. The
 * navigator paints the scene container from its OWN theme, and it was handed
 * the stock `DarkTheme` — `rgb(1, 1, 1)` — while every dark theme the app
 * ships is a deep colour. The gap the screens slide across was therefore
 * never the app's background.
 */

describe('navigationTheme', () => {
  it('paints the scene with the app background, not the stock near-black', () => {
    const colors = getThemeColors('royal-purple', 'dark');

    expect(DarkTheme.colors.background).not.toBe(colors.background);
    expect(navigationTheme('dark', colors).colors.background).toBe(colors.background);
  });

  it('does the same for light themes, where the stock grey read as a flicker', () => {
    const colors = getThemeColors('pearl-white', 'light');

    expect(DefaultTheme.colors.background).not.toBe(colors.background);
    expect(navigationTheme('light', colors).colors.background).toBe(colors.background);
  });

  it('keeps the base theme it did not set, so nothing else changes shape', () => {
    const theme = navigationTheme('dark', getThemeColors('royal-purple', 'dark'));

    expect(theme.dark).toBe(DarkTheme.dark);
    expect(theme.fonts).toEqual(DarkTheme.fonts);
  });

  it('follows the app palette for every colour the navigator paints with', () => {
    const colors = getThemeColors('emerald-garden', 'dark');
    const theme = navigationTheme('dark', colors);

    expect(theme.colors).toMatchObject({
      card: colors.background,
      text: colors.text,
      border: colors.border,
      primary: colors.primary,
      notification: colors.danger,
    });
  });
});
