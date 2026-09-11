/** What `POST /assistant/intent-token` answers with. */
export interface AssistantIntentTokenResponseDto {
  readonly token?: string;
  readonly expiresAt?: string;
}
