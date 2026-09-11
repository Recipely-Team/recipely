/**
 * What a client needs to open a Gemini Live session — hand exactly this to
 * `GeminiLiveSession.connect` (it is a `GeminiLiveCredentials`).
 */
export interface MintedGeminiToken {
  readonly token: string;
  readonly model: string;
  readonly wsUrl: string;
  /** When the session this token opens must end. */
  readonly expiresAt: string;
}
