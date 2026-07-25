export interface RecipeTimerState {
  /** True while a timer entry exists in the store (running, paused, or done). */
  isActive: boolean;
  isPaused: boolean;
  /** True once the countdown has reached zero (entry still present until dismissed). */
  isDone: boolean;
  remainingSeconds: number;
  start: () => Promise<void>;
  stop: () => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
}
