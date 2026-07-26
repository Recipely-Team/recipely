/**
 * Unit tests for the resolveRedirect helper exported from login-screen.
 *
 * The helper is pure (no side-effects, no hooks), but lives in a module that
 * also imports React Native / expo-router. The jest-expo preset transforms all
 * required packages, so the module resolves without a renderer.
 *
 * Key implementation notes confirmed by reading the source:
 *  - The value is NOT decoded (no decodeURIComponent call) — percent-encoded
 *    paths are accepted or rejected based on their raw string.
 *  - Blocks: undefined | non-string | starts with '//' | starts with '/login'
 *  - Accepts: any other string that starts with '/'
 *  - Default fallback: '/recipes'
 */

// Heavy expo-router / RN peer imports are mocked so this file runs as a plain
// unit test without a native runtime. Only the resolveRedirect symbol is under
// test — nothing here exercises any React component.
import { resolveRedirect } from '@presentation/app/login/model/resolve-redirect';

jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(() => ({})),
  useRouter: jest.fn(() => ({ replace: jest.fn(), push: jest.fn() })),
}));
jest.mock('expo-linear-gradient', () => ({ LinearGradient: 'LinearGradient' }));
jest.mock('@expo/vector-icons', () => ({ MaterialCommunityIcons: 'MaterialCommunityIcons' }));
jest.mock('expo-apple-authentication', () => ({
  AppleAuthenticationButton: 'AppleAuthenticationButton',
  AppleAuthenticationButtonType: { SIGN_IN: 'SIGN_IN' },
  AppleAuthenticationButtonStyle: { BLACK: 'BLACK' },
}));
jest.mock('@presentation/bootstrap/use-stores', () => ({
  useStores: jest.fn(() => ({
    authStore: jest.fn(() => ({ state: { status: 'idle' }, signIn: jest.fn(), signInWithGoogle: jest.fn(), signInWithApple: jest.fn() })),
  })),
}));
jest.mock('@presentation/base/widgets/brand/recipely-logo', () => ({ RecipelyLogo: 'RecipelyLogo' }));
jest.mock('@presentation/base/widgets/text/themed-text', () => ({ ThemedText: 'ThemedText' }));
jest.mock('@presentation/base/widgets/feedback/form-banner', () => ({ FormBanner: 'FormBanner' }));
jest.mock('@presentation/base/errors/auth-form-message', () => ({ authFormMessage: jest.fn(() => undefined) }));
jest.mock('@presentation/base/responsive/layout-context', () => ({
  useLayout: jest.fn(() => ({ isWebShell: false, orientation: 'portrait' })),
}));
jest.mock('@presentation/base/theme/context/use-theme', () => ({
  useTheme: jest.fn(() => ({ colors: {} })),
}));
jest.mock('@presentation/base/theme/tokens/effects/shadows', () => ({ shadows: { lg: {} } }));
jest.mock('@presentation/base/theme', () => ({
  spacing: {},
  radii: {},
  fontSizes: {},
  sizes: {},
}));
jest.mock('@presentation/i18n', () => ({
  t: jest.fn(() => ({
    login: {
      title: '',
      subtitle: '',
      hint: '',
      emailPlaceholder: '',
      passwordPlaceholder: '',
      signIn: '',
      forgotPassword: '',
      forgot: '',
      noAccount: '',
      signUp: '',
      orContinueWith: '',
      signInWithGoogle: '',
      invalidCredentials: '',
    },
  })),
}));

describe('resolveRedirect', () => {
  describe('valid internal paths — returns the path unchanged', () => {
    it('returns a deep recipe path', () => {
      expect(resolveRedirect('/recipes/123')).toBe('/recipes/123');
    });

    it('returns /profile', () => {
      expect(resolveRedirect('/profile')).toBe('/profile');
    });

    it('returns a path with a query string', () => {
      expect(resolveRedirect('/recipes?tab=saved')).toBe('/recipes?tab=saved');
    });

    it('returns a percent-encoded path as-is (no decoding performed)', () => {
      // The implementation does a raw string check — it does NOT call
      // decodeURIComponent, so the encoded form is accepted unchanged.
      expect(resolveRedirect('/recipes/a%20b')).toBe('/recipes/a%20b');
    });
  });

  describe('unsafe or absent values — falls back to /recipes', () => {
    it('returns /recipes for undefined', () => {
      expect(resolveRedirect(undefined)).toBe('/recipes');
    });

    it('returns /recipes for an array value (expo-router multi-value param)', () => {
      expect(resolveRedirect(['/a', '/b'])).toBe('/recipes');
    });

    it('returns /recipes for a protocol-relative open-redirect (starts with //)', () => {
      expect(resolveRedirect('//evil.com')).toBe('/recipes');
    });

    it('returns /recipes for an absolute external URL', () => {
      expect(resolveRedirect('https://evil.com')).toBe('/recipes');
    });

    it('returns /recipes for /login to prevent login-loop', () => {
      expect(resolveRedirect('/login')).toBe('/recipes');
    });

    it('returns /recipes for /login with a query string', () => {
      expect(resolveRedirect('/login?x=1')).toBe('/recipes');
    });

    it('returns /recipes for an empty string', () => {
      expect(resolveRedirect('')).toBe('/recipes');
    });

    it('returns /recipes for a relative path without leading slash', () => {
      expect(resolveRedirect('recipes/123')).toBe('/recipes');
    });
  });
});
