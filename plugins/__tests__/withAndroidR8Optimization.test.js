const {
  useOptimizedProguardFile,
} = require('../withAndroidR8Optimization');

// Mirrors the release buildType the Expo/RN Android template generates.
const TEMPLATE_RELEASE_BLOCK = `
    buildTypes {
        release {
            def enableShrinkResources = findProperty('android.enableShrinkResourcesInReleaseBuilds') ?: 'false'
            shrinkResources enableShrinkResources.toBoolean()
            minifyEnabled enableMinifyInReleaseBuilds
            proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
        }
    }
`;

describe('useOptimizedProguardFile', () => {
  it('swaps the non-optimizing default config for the optimizing one', () => {
    const patched = useOptimizedProguardFile(TEMPLATE_RELEASE_BLOCK);

    expect(patched).toContain(
      'getDefaultProguardFile("proguard-android-optimize.txt")',
    );
    expect(patched).not.toContain(
      'getDefaultProguardFile("proguard-android.txt")',
    );
  });

  it('leaves the project-specific proguard-rules.pro entry in place', () => {
    expect(useOptimizedProguardFile(TEMPLATE_RELEASE_BLOCK)).toContain(
      '"proguard-rules.pro"',
    );
  });

  it('is idempotent across repeated prebuilds', () => {
    const once = useOptimizedProguardFile(TEMPLATE_RELEASE_BLOCK);

    expect(useOptimizedProguardFile(once)).toBe(once);
  });

  it('throws when the template anchor is gone instead of shipping unoptimized', () => {
    expect(() =>
      useOptimizedProguardFile('android { buildTypes { release { } } }'),
    ).toThrow(/anchor not found/);
  });
});
