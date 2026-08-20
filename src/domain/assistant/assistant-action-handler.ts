import type { AssistantActionResultType } from '@domain/assistant/assistant-action-result';

/**
 * One action's implementation.
 *
 * `arg` is optional because most actions take none, and it is a bare string
 * because that is all the model can send — every handler that needs more
 * structure parses it itself rather than the registry guessing a shape.
 */
export type AssistantActionHandlerType = (arg?: string) => Promise<AssistantActionResultType>;
