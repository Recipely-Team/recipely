import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform, useColorScheme } from 'react-native';
import { getKeyValueStore } from '@application/storage/get-key-value-store';
import { useLocale } from '@presentation/i18n/use-locale';
import { useIsHydrated } from '@presentation/base/responsive/use-is-hydrated';
import { ALL_THEMES, getThemeColors } from '@presentation/base/theme/colors/palette/themes';
import type { ThemeId } from '@presentation/base/theme/context/theme-id';
import { DEFAULT_THEME_ID } from '@presentation/base/theme/context/theme-defaults';
import type { ThemeColors } from '@presentation/base/theme/colors/palette/theme-colors';
import type { ThemePreference } from '@presentation/base/theme/context/theme-preference';
import type { ThemeVariant } from '@presentation/base/theme/context/theme-variant';
import type { ThemeContextValue } from '@presentation/base/theme/context/theme-context-value';

export const ThemeContext = createContext<ThemeContextValue>({
  themeId: DEFAULT_THEME_ID,
  preference: 'system',
  scheme: 'light',
  colors: {} as ThemeColors,
  setThemeId: () => {},
  setPreference: () => {},
});

/**
 * Guards against a `theme_id` value persisted before the palette was trimmed
 * (or otherwise corrupted) — anything no longer in `ALL_THEMES` would make
 * `getThemeColors` throw on an undefined lookup, so callers must fall back to
 * the default rather than trusting storage blindly.
 */
const isKnownThemeId = (value: string): value is ThemeId =>
  (ALL_THEMES as string[]).includes(value);

export interface AppThemeProviderProps {
  children: ReactNode;
}

const isThemePreference = (v: string): v is ThemePreference =>
  v === 'system' || v === 'light' || v === 'dark';

export const AppThemeProvider = ({ children }: AppThemeProviderProps): React.JSX.Element => {
  const systemScheme = useColorScheme();
  const hydrated = useIsHydrated();
  // Locale is part of this provider on purpose: react-navigation blocks
  // parent-driven re-renders of mounted screens, so a language switch would
  // otherwise only show after something else (e.g. a theme change) re-rendered
  // them. Every screen consumes this context, so rebuilding the value on a
  // locale change re-renders each screen and re-evaluates its t() strings.
  const locale = useLocale();
  const [themeId, setThemeIdState] = useState<ThemeId>(DEFAULT_THEME_ID);
  const [preference, setPreferenceState] = useState<ThemePreference>('system');

  // Load persisted theme + preference on mount
  useEffect(() => {
    void getKeyValueStore().getItem('theme_id').then((stored) => {
      // A previously-persisted theme may no longer be part of the palette
      // (e.g. after trimming it down) — fall back to the default instead of
      // handing an unknown id to `getThemeColors`, which would crash.
      setThemeIdState(stored !== null && isKnownThemeId(stored) ? stored : DEFAULT_THEME_ID);
    });
    void getKeyValueStore().getItem('theme_preference').then((stored) => {
      if (stored !== null && isThemePreference(stored)) {
        setPreferenceState(stored);
      }
    });
  }, []);

  const setThemeId = useCallback((id: ThemeId) => {
    setThemeIdState(id);
    void getKeyValueStore().setItem('theme_id', id);
  }, []);

  const setPreference = useCallback((pref: ThemePreference) => {
    setPreferenceState(pref);
    void getKeyValueStore().setItem('theme_preference', pref);
  }, []);

  // On web the static export prerenders without `prefers-color-scheme`, so the
  // server HTML is always light. Ignore the live system scheme until after
  // hydration so the first client render matches and React can hydrate cleanly
  // (React error #418). `preference` itself loads from storage in an effect, so
  // it is already at its SSR default ('system') on the first render.
  // React Native 0.83 widened `ColorSchemeName` with 'unspecified' (the system
  // reports no preference); like a null scheme it resolves to light, so every
  // non-'dark' value collapses to the same branch.
  const ignoreSystemScheme = Platform.OS === 'web' && !hydrated;
  const effectiveSystemScheme: ThemeVariant =
    !ignoreSystemScheme && systemScheme === 'dark' ? 'dark' : 'light';

  const scheme: ThemeVariant =
    preference === 'system' ? effectiveSystemScheme : preference;

  // Memoize to ensure stable reference when themeId/scheme unchanged
  const colors = useMemo(() => getThemeColors(themeId, scheme), [themeId, scheme]);

  const value = useMemo(
    () => ({ themeId, preference, scheme, colors, setThemeId, setPreference }),
    // `locale` is a deliberate extra dependency: a new value identity per
    // locale re-renders every useTheme consumer (see comment above).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [themeId, preference, scheme, colors, setThemeId, setPreference, locale],
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};