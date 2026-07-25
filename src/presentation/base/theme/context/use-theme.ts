import { useContext } from 'react';
import { ThemeContext } from '@presentation/base/theme/context/theme-context';
import type { ThemeContextValue } from '@presentation/base/theme/context/theme-context-value';

/** Reads the active theme (id, preference, scheme, colors, and setters). */
export const useTheme = (): ThemeContextValue => useContext(ThemeContext);
