import { isString } from '@core/guards/type-guards';
import { PublishBlocker, type PublishBlockerType } from '@domain/recipes/publishing/publish-blocker';

const KNOWN: ReadonlySet<string> = new Set(Object.values(PublishBlocker));

/**
 * The blockers a wire list names, dropping any this build has no word for.
 *
 * `undefined` stays `undefined`: the list is sent to the owner only, and its
 * absence means "not told", not "nothing missing".
 */
export const toPublishBlockers = (
  raw: readonly unknown[] | undefined,
): readonly PublishBlockerType[] | undefined =>
  raw === undefined
    ? undefined
    : raw.filter((item): item is PublishBlockerType => isString(item) && KNOWN.has(item));
