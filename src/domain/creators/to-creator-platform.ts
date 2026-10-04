import { isString } from '@core/guards/type-guards';
import { CreatorPlatform, type CreatorPlatformType } from '@domain/creators/creator-platform';

const KNOWN: ReadonlySet<string> = new Set(Object.values(CreatorPlatform));

/** The creator platform a wire value names, or `null` for anything this build has no word for. */
export const toCreatorPlatform = (raw: string | null | undefined): CreatorPlatformType | null =>
  isString(raw) && KNOWN.has(raw) ? (raw as CreatorPlatformType) : null;
