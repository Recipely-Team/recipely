import { createContext, type ReactNode } from 'react';
import type { StoresType } from '@presentation/bootstrap/stores';

export const StoresContext = createContext<StoresType | null>(null);

export interface StoresProviderProps {
  value: StoresType;
  children: ReactNode;
}

export const StoresProvider = ({ value, children }: StoresProviderProps): React.JSX.Element => {
  return <StoresContext.Provider value={value}>{children}</StoresContext.Provider>;
};
