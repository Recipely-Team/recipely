import { CharConstants } from '@core/constants';
import { isOsReachableAction } from '@domain/assistant/os/is-os-reachable-action';
import { OsIntentId } from '@domain/assistant/os/os-intent-id';
import type { OsIntentIdType } from '@domain/assistant/os/os-intent-id';
import type { OsIntentLink } from '@presentation/navigation/os-intent-link-shape';

const LINK_PATH = 'assistant/run';
const ID_PARAM = 'id';
const ACTION_PARAM = 'action';
const ARG_PARAM = 'arg';

const OS_INTENT_IDS = new Set<string>(Object.values(OsIntentId));

const isOsIntentId = (value: string): value is OsIntentIdType => OS_INTENT_IDS.has(value);

/**
 * The query string of a path whose route is exactly the intent link.
 *
 * A scheme URL reaches expo-router with its host already collapsed into the
 * path, and the leading slashes differ between a cold launch and a warm one, so
 * both shapes are normalised before comparing. The path is MATCHED, not
 * searched: `includes('assistant/run')` would have accepted a recipe whose id
 * happened to contain the phrase.
 */
const queryOf = (path: string): string | null => {
  const [route, ...rest] = path.split('?');
  const normalised = (route ?? CharConstants.empty).replace(/^\/+|\/+$/g, CharConstants.empty);
  if (normalised !== LINK_PATH) return null;
  return rest.join('?');
};

/**
 * Reads the deep link an Android shortcut opens the app with.
 *
 * @remarks
 * - **Android and iOS arrive by different roads, on purpose.** An iOS App Intent
 *   runs code, so it writes the request into the shared container and the app
 *   drains a queue. An Android shortcut only carries an `Intent`, and nothing of
 *   ours runs before the launcher fires it — so the request travels in the URL.
 *   Both roads end at the same registry.
 * - **The id is required and the action is not.** The open-ended entry has no
 *   action at all: it carries a sentence for the assistant to interpret, and a
 *   link that spelled its absent action as the text `null` would be asking the
 *   registry to run a word called "null".
 * - **A word this build does not know is refused here.** A shortcut pinned to
 *   the launcher outlives the version that created it: a user who pinned one
 *   last year can tap it after an update that renamed the action. That has to
 *   land the app on a screen, not dispatch a word nothing answers. So is a word
 *   the OS may not send at all — `confirm`, `cancel` — because any app on the
 *   phone can fire this link (see `isOsReachableAction`).
 */
export function parseOsIntentLink(path: string): OsIntentLink | null {
  const query = queryOf(path);
  if (query === null) return null;

  const params = new URLSearchParams(query);
  const id = params.get(ID_PARAM);
  if (id === null || !isOsIntentId(id)) return null;

  const action = params.get(ACTION_PARAM);
  if (action !== null && !isOsReachableAction(action)) return null;

  const arg = params.get(ARG_PARAM);
  return {
    id,
    action,
    arg: arg === null || arg === CharConstants.empty ? null : arg,
  };
}
