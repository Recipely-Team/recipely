import { useContext } from 'react';
import { StoresContext } from '@presentation/bootstrap/stores-context';
import type { ApplicationStores } from '@application/di/application-stores';

/** Reads the DI-provided store bundle; throws when used outside a provider. */
export const useStores = (): ApplicationStores => {
  const value = useContext(StoresContext);
  if (value === null) {
    throw new Error('useStores called outside of StoresProvider');
  }
  return value;
};
