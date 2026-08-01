/**
 * A single turn in the AI refine conversation attached to a draft. `error`
 * flags an assistant turn that failed to produce a usable refinement so the UI
 * can render it distinctly. Mirrors the backend `ChatMessage` wire shape.
 */
export interface ChatMessage {
  role: 'user' | 'assistant'; // TO DO: role enum gibi bir şey olabilir static isimler olmasın artık
  content: string;
  error?: boolean;
}
