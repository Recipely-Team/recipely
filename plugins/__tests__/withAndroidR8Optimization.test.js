const {
  useOptimizedProguardFile,
  enableOptimizedResourceShrinking,
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

const KEY = 'android.r8.optimizedResourceShrinking';

describe('enableOptimizedResourceShrinking', () => {
  it('appends the property when gradle.properties does not have it', () => {
    const result = enableOptimizedResourceShrinking([
      { type: 'property', key: 'android.useAndroidX', value: 'true' },
    ]);

    expect(result).toContainEqual({
      type: 'property',
      key: KEY,
      value: 'true',
    });
  });

  it('preserves the properties already present', () => {
    const result = enableOptimizedResourceShrinking([
      { type: 'property', key: 'android.useAndroidX', value: 'true' },
    ]);

    expect(result).toContainEqual({
      type: 'property',
      key: 'android.useAndroidX',
      value: 'true',
    });
  });

  it('overwrites a false value instead of appending a duplicate', () => {
    const result = enableOptimizedResourceShrinking([
      { type: 'property', key: KEY, value: 'false' },
    ]);

    expect(result.filter((item) => item.key === KEY)).toEqual([
      { type: 'property', key: KEY, value: 'true' },
    ]);
  });

  it('is idempotent across repeated prebuilds', () => {
    const once = enableOptimizedResourceShrinking([]);

    expect(enableOptimizedResourceShrinking(once)).toEqual(once);
  });
});
