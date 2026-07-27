export interface TimersBarStoreState {
  /** True while the docked bar is parked as a corner pill. */
  collapsed: boolean;
  hydrate: () => Promise<void>;
  setCollapsed: (collapsed: boolean) => Promise<void>;
}
