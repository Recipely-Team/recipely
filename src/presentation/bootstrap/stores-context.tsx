import { createContext, type ReactNode } from 'react';
import type { ApplicationStores } from '@application/di/application-stores';

export const StoresContext = createContext<ApplicationStores | null>(null);

export interface StoresProviderProps {
  value: ApplicationStores;
  children: ReactNode;
}

export const StoresProvider = ({ value, children }: StoresProviderProps): React.JSX.Element => {
  return <StoresContext.Provider value={value}>{children}</StoresContext.Provider>;
};
