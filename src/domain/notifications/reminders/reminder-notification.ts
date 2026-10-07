/** A come-back reminder ready for the notification port. */
export interface ReminderNotification {
  /** Epoch ms it fires at, local evening of its day. */
  fireAtMs: number;
  title: string;
  body: string;
  /** Days of absence it marks; reported back when the reminder is opened. */
  day: number;
  /** Which copy variant it shows; reported back when the reminder is opened. */
  variant: number;
}
