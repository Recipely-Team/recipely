/**
 * The backend's answer to a session request.
 *
 * `token` is absent exactly when the budget is spent — that is a normal 200,
 * not an error, because the app's response is to offer the text mode rather
 * than to show a failure. `reason` says which limit was hit: a user out of
 * their own daily allowance and one caught by the app-wide cap need different
 * copy, since "come back tomorrow" is wrong advice for the second.
 *
 * `unlimited` marks an account the server does not meter at all — an admin.
 * The number beside it is then a floor rather than a balance, so a client that
 * counts it down to a teardown would end a session the server never intended
 * to limit.
 */
export interface AssistantSessionResponseDto {
  token?: string;
  model?: string;
  wsUrl?: string;
  expiresAt?: string;
  budgetRemainingSec?: number;
  unlimited?: boolean;
  reason?: string;
}
