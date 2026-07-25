import { createContext, useMemo, useState, type ReactNode } from 'react';
import type { WebShellStateValue } from '@presentation/base/web-shell/web-shell-state-value';
import { CharConstants } from '@core/constants';

export const WebShellStateContext = createContext<WebShellStateValue>({
  searchQuery: CharConstants.empty,
  setSearchQuery: () => {},
});

export interface WebShellStateProviderProps {
  children: ReactNode;
}

/**
 * Holds UI state that only exists in the web shell so screens stay decoupled
 * from the header's search input. Mobile screens never read this — they own
 * their local search state inside the sticky header below the app bar.
 */
export const WebShellStateProvider = ({
  children,
}: WebShellStateProviderProps): React.JSX.Element => {
  const [searchQuery, setSearchQuery] = useState(CharConstants.empty);
  const value = useMemo<WebShellStateValue>(
    () => ({ searchQuery, setSearchQuery }),
    [searchQuery],
  );
  return <WebShellStateContext.Provider value={value}>{children}</WebShellStateContext.Provider>;
};
