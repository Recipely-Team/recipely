export interface TimersBarStoreState {
  /** True while the docked bar is parked as a corner pill. */
  collapsed: boolean;
  /** True once the user has collapsed or expanded the bar this session. */
  chosen: boolean;
  hydrate: () => Promise<void>;
  setCollapsed: (collapsed: boolean) => Promise<void>;
}
