/**
 * What the assistant answered a typed turn with.
 *
 * `reply` is what the user reads; `action` is what the app performs. A turn
 * routinely carries both — "opening it now" beside the command — and either
 * alone. The action's name is raw for the same reason a spoken tool call's is:
 * the registry is what narrows it, because the registry is what can answer.
 */
export interface AssistantTextReply {
  readonly reply: string;
  readonly action?: { readonly name: string; readonly arg?: string };
}
