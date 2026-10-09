export interface DmArrivalStoreState {
  /** Recipe id → the DM attempt the viewer arrived through (`?dm=<sendId>`). */
  arrivals: Readonly<Record<string, string>>;
  /** Remembers the arrival and reports the open once per attempt. */
  arrive: (recipeId: string, sendId: string) => void;
  /** Reports a save of `recipeId` once, when the viewer arrived at it through a DM. */
  saved: (recipeId: string) => void;
}
