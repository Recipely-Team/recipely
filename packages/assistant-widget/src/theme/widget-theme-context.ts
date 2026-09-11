import { createContext, useContext } from 'react';
import type { AssistantTheme } from './assistant-theme';
import { defaultTheme } from './default-theme';

export const WidgetThemeContext = createContext<AssistantTheme>(defaultTheme);

export function useWidgetTheme(): AssistantTheme {
  return useContext(WidgetThemeContext);
}
