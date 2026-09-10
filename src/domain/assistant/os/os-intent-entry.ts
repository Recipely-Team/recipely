import type { AssistantActionType } from '@domain/assistant/actions/assistant-action-type';
import type { OsIntentIdType } from '@domain/assistant/os/os-intent-id';
import type { OsIntentParameterKindType } from '@domain/assistant/os/os-intent-parameter-kind';

/**
 * One capability, described once for iOS, Android and the app itself.
 *
 * @remarks
 * - **`action` may be null, and that is the interesting case.** A null action
 *   means the entry has no fixed word: the sentence goes to the assistant and
 *   the assistant decides what to do with it. Every other entry names an
 *   `AssistantActionType` the registry already answers, which is why this
 *   integration adds no new vocabulary.
 * - **`headless` is a safety switch, not a performance one.** A headless entry
 *   is answered by native code with no screen and no confirmation sheet, so
 *   nothing destructive may ever be marked headless — the five
 *   `CONFIRMED_ACTIONS` least of all. `check:structure` rule X blocks on that,
 *   and `os-intent-catalogue.test.ts` asserts it again from the other side.
 * - **`arg` is for entries that are a word plus a constant**, like opening My
 *   Recipes: the action is `navigate` and the argument is always the same, so
 *   the OS is not asked to supply one.
 */
export interface OsIntentEntry {
  readonly id: OsIntentIdType;
  readonly action: AssistantActionType | null;
  readonly arg: string | null;
  readonly parameter: OsIntentParameterKindType | null;
  readonly headless: boolean;
  /** Key into the i18n catalogue; the OS phrases are generated from it. */
  readonly titleKey: string;
}
