/**
 * The narrow token the phone's own assistant carries, and when it dies.
 *
 * @remarks
 * - **Never the session JWT.** This one reaches the assistant endpoints and
 *   nothing else, which is what makes it safe to leave in a shared container
 *   the native side can read weeks later without a refresh flow.
 * - **`expiresAt` is an absolute instant, not a lifetime.** The consumer is
 *   native code reading a container long after the write: a "valid for 30 days"
 *   it cannot date is a token it must either trust forever or discard on every
 *   launch.
 */
export interface OsAssistantCredential {
  readonly token: string;
  /** Milliseconds since the epoch. */
  readonly expiresAt: number;
}
