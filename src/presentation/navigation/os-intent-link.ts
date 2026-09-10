import { CharConstants } from '@core/constants';
import { isAssistantAction } from '@domain/assistant/actions/is-assistant-action';
import type { OsIntentLink } from '@presentation/navigation/os-intent-link-shape';

const LINK_PATH = 'assistant/run';
const ACTION_PARAM = 'action';
const ARG_PARAM = 'arg';

/**
 * Reads the deep link an Android shortcut opens the app with.
 *
 * @remarks
 * - **Android and iOS arrive by different roads, on purpose.** An iOS App Intent
 *   runs code, so it writes the request into the shared container and the app
 *   drains a queue. An Android shortcut only carries an `Intent`, and nothing
 *   of ours runs before the launcher fires it — so the request travels in the
 *   URL. Both roads end at the same registry.
 * - **A word this build does not know is refused here.** A shortcut pinned to
 *   the launcher outlives the version that created it: a user who pinned a
 *   recipe last year can tap it after an update that renamed the action. That
 *   has to land the app on a screen, not dispatch a word nothing answers.
 * - **The path is matched, not merely searched.** `includes('assistant/run')`
 *   would have accepted a recipe whose id contained the phrase.
 */
export function parseOsIntentLink(path: string): OsIntentLink | null {
  const query = queryOf(path);
  if (query === null) return null;

  const params = new URLSearchParams(query);
  const action = params.get(ACTION_PARAM);
  if (action === null || !isAssistantAction(action)) return null;

  const arg = params.get(ARG_PARAM);
  return { action, arg: arg === null || arg === CharConstants.empty ? null : arg };
}

/**
 * The query string of a path whose route is exactly the intent link.
 *
 * A scheme URL reaches expo-router with its host already collapsed into the
 * path, and the leading slashes differ between a cold launch and a warm one,
 * so both shapes are normalised before comparing.
 */
const queryOf = (path: string): string | null => {
  const [route, ...rest] = path.split('?');
  const normalised = (route ?? CharConstants.empty).replace(/^\/+|\/+$/g, CharConstants.empty);
  if (normalised !== LINK_PATH) return null;
  return rest.join('?');
};
