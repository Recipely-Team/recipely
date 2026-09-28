import { isString } from '@core/guards/type-guards';
import { SourcePlatform, type SourcePlatformType } from '@domain/recipes/provenance/source-platform';

const KNOWN: ReadonlySet<string> = new Set(Object.values(SourcePlatform));

/**
 * The platform a wire value names, or `null` for anything this build has no
 * word for.
 *
 * A server that grows a third platform must not make an older app draw a mark
 * it cannot name. The recipe is still imported — it just does not say from
 * where, which is the honest reading of a value we do not understand.
 */
export const toSourcePlatform = (raw: string | null | undefined): SourcePlatformType | null =>
  isString(raw) && KNOWN.has(raw) ? (raw as SourcePlatformType) : null;
