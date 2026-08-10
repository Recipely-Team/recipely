/**
 * The `error` object inside the Recipely error envelope.
 *
 * Every field optional on purpose: a backend older than the message catalogue
 * sends no `messageKey`, and `field` only appears on validation failures. The
 * shape is named rather than nested inline because two readers depend on it —
 * the axios error mapper and the envelope reader — and a wire contract two
 * places parse should not be spelled out twice.
 */
export interface RecipelyErrorPayload {
  code?: string;
  message?: string;
  messageKey?: string;
  field?: string;
}
