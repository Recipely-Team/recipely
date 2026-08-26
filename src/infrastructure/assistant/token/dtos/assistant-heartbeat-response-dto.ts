/**
 * What the server has left in the user's allowance after charging a report.
 *
 * `unlimited` says the account is not metered, so the number is a floor and
 * the session must not be torn down on it.
 */
export interface AssistantHeartbeatResponseDto {
  budgetRemainingSec?: number;
  unlimited?: boolean;
}
