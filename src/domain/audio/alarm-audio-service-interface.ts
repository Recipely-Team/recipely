/**
 * Port for the looping alarm tone played while the timer-complete overlay is
 * visible. The infrastructure implementation wraps the platform audio API
 * (no-op on web); consumers resolve it through the DI container.
 */
export interface AlarmAudioServiceInterface {
  /** Starts the looping alarm tone. Idempotent while already playing. */
  start(): Promise<void>;
  /** Stops and unloads the alarm tone. Safe to call when nothing is playing. */
  stop(): Promise<void>;
}
