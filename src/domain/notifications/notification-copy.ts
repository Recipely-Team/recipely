/**
 * The words a local notification shows the user.
 *
 * @remarks
 * Infrastructure cannot reach the i18n catalogue, and these strings are read by
 * the person holding the phone — the dismiss button, the Android channel name
 * in system settings, the alarm body. They were hard-coded, which meant an
 * English user got a Turkish "Kapat" and a Turkish user got an English "Timer
 * is done!". The caller lives in presentation and has `t()`, so it supplies
 * them and the port stays language-agnostic.
 */
export interface NotificationCopy {
  /** Action button on the alarm notification. */
  dismissAction: string;
  /** Android channel name, shown in the OS notification settings. */
  channelName: string;
  /** Body of the timer-completion alarm. */
  timerDoneBody: string;
}
