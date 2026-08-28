/**
 * Custom analytics event names.
 *
 * @remarks
 * Named here rather than typed at the call site because an event name is a
 * JOIN KEY: a dashboard is built against the exact string, and a typo does not
 * fail — it silently starts a second, empty series next to the one being read.
 */
export const AnalyticsEvent = {
  /** A failure was shown to the user. Carries its `code` and where it surfaced. */
  failureShown: 'failure_shown',
  /** One per launch: the device, OS, build and locale the session ran on. */
  deviceProfile: 'device_profile',
} as const;
