import type { AssistantActionType } from '@domain/assistant/actions/assistant-action-type';
import type { OsIntentIdType } from '@domain/assistant/os/os-intent-id';

/**
 * What a launcher shortcut's URL turned out to be asking for.
 *
 * The same three fields an iOS App Intent writes into the shared queue, because
 * they are the same request arriving by a different road. `action` is null for
 * the open-ended entry, where the assistant decides rather than the catalogue.
 */
export interface OsIntentLink {
  readonly id: OsIntentIdType;
  readonly action: AssistantActionType | null;
  readonly arg: string | null;
}
