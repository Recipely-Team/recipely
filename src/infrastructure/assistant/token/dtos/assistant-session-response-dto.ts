/**
 * The backend's answer to a session request.
 *
 * `token` is absent exactly when the budget is spent — that is a normal 200,
 * not an error, because the app's response is to offer the text mode rather
 * than to show a failure. `reason` says which limit was hit: a user out of
 * their own daily allowance and one caught by the app-wide cap need different
 * copy, since "come back tomorrow" is wrong advice for the second.
 */
export interface AssistantSessionResponseDto {
  token?: string;
  model?: string;
  wsUrl?: string;
  expiresAt?: string;
  budgetRemainingSec?: number;
  reason?: string;
}
