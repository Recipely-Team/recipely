/**
 * The backend's answer to a typed turn.
 *
 * Both halves are optional on the wire: the model may only speak, only act, or
 * do both. A reply carrying neither is a malformed answer rather than a silent
 * one, and the mapper is where that is decided.
 */
export interface AssistantMessageResponseDto {
  reply?: string;
  action?: { name?: string; arg?: string };
}
