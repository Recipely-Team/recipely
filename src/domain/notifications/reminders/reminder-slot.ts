/** One point in the come-back series: when it fires and how many days of absence it marks. */
export interface ReminderSlot {
  fireAtMs: number;
  day: number;
}
