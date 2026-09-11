/**
 * What a Gemini Live session needs to connect.
 *
 * @remarks
 * - **An ephemeral token, never an API key.** Your server holds the key and
 *   mints a short-lived `auth_tokens/…` token per session; the device only ever
 *   holds that.
 * - **The session's configuration is baked into the token.** System
 *   instruction, tools, voice and transcription are set when the token is
 *   minted: measured against the live API, a client's own setup is discarded
 *   for a token that carries one, and tools the token did not declare simply
 *   do not exist — with no error saying so.
 * - **`model` must be the one the token was minted for**, e.g.
 *   `models/gemini-live-2.5-flash-preview`. `wsUrl` defaults to the constrained
 *   endpoint, the only one an ephemeral token opens.
 */
export interface GeminiLiveCredentials {
  readonly token: string;
  readonly model: string;
  readonly wsUrl?: string;
}
