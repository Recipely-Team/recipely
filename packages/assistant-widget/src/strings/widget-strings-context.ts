import { createContext, useContext } from 'react';
import type { AssistantStrings } from './assistant-strings';
import { defaultStrings } from './default-strings';

export const WidgetStringsContext = createContext<AssistantStrings>(defaultStrings);

export function useWidgetStrings(): AssistantStrings {
  return useContext(WidgetStringsContext);
}
