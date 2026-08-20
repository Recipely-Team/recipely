/**
 * What the backend hands back when it mints a voice session.
 *
 * @remarks
 * - **The token is ephemeral and single-use.** It exists so the phone can open
 *   the socket to Google directly — audio bytes never travel through our
 *   server — without the long-lived API key ever reaching a device.
 * - **`model` and `wsUrl` come down the wire rather than being compiled in.**
 *   A model that appears in `ListModels` is not necessarily callable, and this
 *   app has already had a published id answer `NOT_FOUND`; deciding server-side
 *   means a model change ships without an app release.
 * - **`budgetRemainingSec` is the server's answer, not a local tally.** The
 *   daily allowance is enforced where it cannot be edited; zero means the
 *   assistant falls back to text and never opens a socket at all.
 */
export interface LiveSessionCredentials {
  readonly token: string;
  readonly model: string;
  readonly wsUrl: string;
  readonly expiresAt: string;
  readonly budgetRemainingSec: number;
}
