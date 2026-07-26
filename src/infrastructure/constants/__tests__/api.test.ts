import { recipeWebUrl, PRIVACY_POLICY_URL, TERMS_OF_USE_URL } from '@infrastructure/constants/api';

describe('recipeWebUrl', () => {
  it('builds the canonical recipe URL using the default web-app base', () => {
    const url = recipeWebUrl('abc-123');

    expect(url).toBe('https://recipely.net/recipes/abc-123');
  });

  it('uses EXPO_PUBLIC_WEB_APP_URL when the env override is set', () => {
    // Isolate: temporarily inject the env var and re-import the module so its
    // top-level constant is re-evaluated from the new value.
    const originalEnv = process.env.EXPO_PUBLIC_WEB_APP_URL;

    try {
      process.env.EXPO_PUBLIC_WEB_APP_URL = 'https://staging.recipely.net';
      jest.resetModules();

      // `require` is the only way to re-read a module after `jest.resetModules()`:
      // this suite exists to prove a module-level constant follows the env var, and
      // a dynamic import needs --experimental-vm-modules, which jest does not run here.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { recipeWebUrl: freshFn } = require('@infrastructure/constants/api') as typeof import('@infrastructure/constants/api');
      expect(freshFn('42')).toBe('https://staging.recipely.net/recipes/42');
    } finally {
      process.env.EXPO_PUBLIC_WEB_APP_URL = originalEnv;
      jest.resetModules();
    }
  });

  it('strips a trailing slash from the env override before building the URL', () => {
    const originalEnv = process.env.EXPO_PUBLIC_WEB_APP_URL;

    try {
      process.env.EXPO_PUBLIC_WEB_APP_URL = 'https://staging.recipely.net/';
      jest.resetModules();

      // `require` is the only way to re-read a module after `jest.resetModules()`:
      // this suite exists to prove a module-level constant follows the env var, and
      // a dynamic import needs --experimental-vm-modules, which jest does not run here.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { recipeWebUrl: freshFn } = require('@infrastructure/constants/api') as typeof import('@infrastructure/constants/api');
      expect(freshFn('42')).toBe('https://staging.recipely.net/recipes/42');
    } finally {
      process.env.EXPO_PUBLIC_WEB_APP_URL = originalEnv;
      jest.resetModules();
    }
  });

  it('handles an empty string recipe id', () => {
    const url = recipeWebUrl('');

    expect(url).toBe('https://recipely.net/recipes/');
  });

  it('handles a uuid-shaped recipe id', () => {
    const id = '7d1f0a3c-2b8d-4c89-9e10-4d2f1cde1234';

    expect(recipeWebUrl(id)).toBe(`https://recipely.net/recipes/${id}`);
  });
});

describe('legal page URLs', () => {
  it('always points at the production static site, regardless of env overrides', () => {
    expect(PRIVACY_POLICY_URL).toBe('https://recipely.net/privacy');
    expect(TERMS_OF_USE_URL).toBe('https://recipely.net/terms');
  });

  it('ignores EXPO_PUBLIC_WEB_APP_URL for legal pages', () => {
    const originalEnv = process.env.EXPO_PUBLIC_WEB_APP_URL;

    try {
      process.env.EXPO_PUBLIC_WEB_APP_URL = 'https://staging.recipely.net';
      jest.resetModules();
      // `require` is the only way to re-read a module after `jest.resetModules()`:
      // this suite exists to prove a module-level constant follows the env var, and
      // a dynamic import needs --experimental-vm-modules, which jest does not run here.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fresh = require('@infrastructure/constants/api') as typeof import('@infrastructure/constants/api');
      expect(fresh.PRIVACY_POLICY_URL).toBe('https://recipely.net/privacy');
      expect(fresh.TERMS_OF_USE_URL).toBe('https://recipely.net/terms');
    } finally {
      process.env.EXPO_PUBLIC_WEB_APP_URL = originalEnv;
      jest.resetModules();
    }
  });
});
