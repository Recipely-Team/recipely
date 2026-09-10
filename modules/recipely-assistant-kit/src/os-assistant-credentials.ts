/**
 * What the native side needs to answer a question without opening the app.
 *
 * @remarks
 * - **Never the app's own session JWT.** A token written here is readable by
 *   anything that can reach the shared container, and the native half has no
 *   refresh flow to keep a short-lived one alive. It carries a separate,
 *   narrowly scoped assistant token that only reaches the assistant endpoints.
 * - **The language is part of the credentials** because a headless answer is
 *   spoken. Siri's own locale is not the app's — a user whose phone is English
 *   and whose Recipely is Turkish expects Turkish back.
 */
export interface OsAssistantCredentials {
  readonly token: string | null;
  /** BCP-47 tag. */
  readonly languageCode: string;
}
