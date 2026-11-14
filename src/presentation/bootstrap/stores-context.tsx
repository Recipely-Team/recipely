import { createContext, type ReactNode } from 'react';
import type { ApplicationStores } from '@application/di/application-stores';
import { ScreenElementsContext } from '@presentation/base/hooks/assistant/screen/screen-elements-context';

export const StoresContext = createContext<ApplicationStores | null>(null);

export interface StoresProviderProps {
  value: ApplicationStores;
  children: ReactNode;
}

export const StoresProvider = ({ value, children }: StoresProviderProps): React.JSX.Element => {
  // Test doubles may leave the registry out; then nothing on screen registers.
  const screenElements = (value.assistantActionRegistry as ApplicationStores['assistantActionRegistry'] | undefined)?.screenElements ?? null;
  return (
    <StoresContext.Provider value={value}>
      <ScreenElementsContext.Provider value={screenElements}>{children}</ScreenElementsContext.Provider>
    </StoresContext.Provider>
  );
};
