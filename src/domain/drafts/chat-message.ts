import type { ChatRole } from '@domain/drafts/chat-role';
/**
 * A single turn in the AI refine conversation attached to a draft. Mirrors the
 * backend `ChatMessage` wire shape.
 *
 * @remarks
 * - **`error`** flags an assistant turn that failed to produce a usable
 *   refinement, so the UI can render it distinctly.
 * - **`rejected`** flags one whose proposed change the cook declined. A
 *   refinement is proposed, not applied, so an assistant summary is no longer
 *   proof the recipe changed — the flag is what keeps the replayed history
 *   honest when the backend reads it back for the next instruction.
 */
export interface ChatMessage {
  role: ChatRole;
  content: string;
  error?: boolean;
  rejected?: boolean;
}
