/**
 * Port for scheduling local timer-completion notifications. The infrastructure
 * implementation wraps the platform notification API (no-op on web); consumers
 * resolve it through the DI container instead of importing the platform module.
 */
export interface NotificationServiceInterface {
  /** Initializes notification handlers, categories, and channels. */
  init(): Promise<void>;
  /** Returns true when the user granted notification permission. */
  requestPermissions(): Promise<boolean>;
  /** Schedules the completion alarm and returns the scheduled notification ids. */
  scheduleTimerComplete(timerId: string, recipeName: string, endTimeMs: number): Promise<string[]>;
  /** Cancels displayed and scheduled notifications by id. */
  cancel(notifIds: string[]): Promise<void>;
}
