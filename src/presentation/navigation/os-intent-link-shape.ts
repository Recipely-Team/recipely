import type { AssistantActionType } from '@domain/assistant/actions/assistant-action-type';

/**
 * What a launcher shortcut's URL turned out to be asking for.
 *
 * Separate from `parseOsIntentLink` only because the parser is runtime code and
 * a type may not share a file with it; the two are one idea.
 */
export interface OsIntentLink {
  readonly action: AssistantActionType;
  readonly arg: string | null;
}
