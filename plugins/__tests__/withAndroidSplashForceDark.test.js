const {
  NIGHT_STYLES,
  REQUIRED_SPLASH_ITEMS,
  REQUIRED_APP_THEME_ITEMS,
} = require('../withAndroidSplashForceDark');
const appJson = require('../../app.json');

/** The items inside one named `<style>` block. */
const blockOf = (xml, name) =>
  xml.match(new RegExp(`<style name="${name.replace(/\./g, '\\.')}"[^>]*>([\\s\\S]*?)</style>`))[1];

// ─── the regression: a lighter orange square on a darker orange launch screen ─
// In dark mode the splash showed a `#EE8941` square floating on `#A14900`. The
// square was the splash logo — expo-splash-screen bakes the background colour
// into that bitmap as an opaque plate — and the surround was the WINDOW, which
// Android's Force Dark had algorithmically darkened. Force Dark does not touch
// bitmaps, so the two disagreed and the seam became a visible box. Nothing was
// misconfigured: both values/ and values-night/ carried #EE8941, which is why
// reading the config proved nothing.
describe('the night styles this plugin writes', () => {
  it('opts the SPLASH theme out of Force Dark — the theme the bug was on', () => {
    // Two earlier attempts patched values/styles.xml and both lost this item,
    // because expo-splash-screen writes that style after every mod we can
    // register. A night override is a different file, so nothing rewrites it.
    expect(blockOf(NIGHT_STYLES, 'Theme.App.SplashScreen')).toContain(
      '<item name="android:forceDarkAllowed">false</item>',
    );
  });

  it('opts the app theme out too, for whatever paints before React Native does', () => {
    expect(blockOf(NIGHT_STYLES, 'AppTheme')).toContain(
      '<item name="android:forceDarkAllowed">false</item>',
    );
  });

  it.each(REQUIRED_SPLASH_ITEMS)(
    'carries %s, because an override replaces the whole style',
    (item) => {
      // Omitting one would fall back to Theme.SplashScreen's default and lose
      // the background or the logo in dark mode — a worse bug than the one
      // being fixed, and only visible at launch on a dark-mode device.
      expect(blockOf(NIGHT_STYLES, 'Theme.App.SplashScreen')).toContain(`name="${item}"`);
    },
  );

  it('points at resources rather than repeating the brand colour', () => {
    // The colour still lives in app.json -> values-night/colors.xml. A literal
    // here would be a second place to change it, and the two would drift.
    const block = blockOf(NIGHT_STYLES, 'Theme.App.SplashScreen');

    expect(block).toContain('@color/splashscreen_background');
    expect(block).toContain('@drawable/splashscreen_logo');
    expect(block).not.toMatch(/#[0-9A-Fa-f]{6}/);
  });

  it('keeps the same parents as the day themes, so nothing else shifts', () => {
    expect(NIGHT_STYLES).toContain(
      '<style name="Theme.App.SplashScreen" parent="Theme.SplashScreen">',
    );
    expect(NIGHT_STYLES).toContain(
      '<style name="AppTheme" parent="Theme.AppCompat.DayNight.NoActionBar">',
    );
  });

  // ─── the second regression: a black screen between splash and first frame ──
  // `Theme.AppCompat.DayNight` paints near-black in dark mode, and that window
  // is what the user looks at from the moment the native splash hands over
  // until React Native draws. The launch screen went off-white, black, app.
  it.each(REQUIRED_APP_THEME_ITEMS)(
    'carries %s on the app theme, because an override replaces the whole style',
    (item) => {
      expect(blockOf(NIGHT_STYLES, 'AppTheme')).toContain(`name="${item}"`);
    },
  );

  it('paints the window the launch colour rather than the DayNight default', () => {
    // Points at the resource prebuild writes from `expo.backgroundColor`; the
    // colour itself is not overridden for night, so both appearances resolve
    // to the one off-white — the same commitment the splash makes.
    expect(blockOf(NIGHT_STYLES, 'AppTheme')).toContain(
      '<item name="android:windowBackground">@color/activityBackground</item>',
    );
    expect(appJson.expo.backgroundColor).toBe(
      appJson.expo.plugins.find((p) => Array.isArray(p) && p[0] === 'expo-splash-screen')[1]
        .backgroundColor,
    );
  });

  it('says it is generated, so nobody edits the copy that gets overwritten', () => {
    expect(NIGHT_STYLES).toContain('do not edit');
  });
});
