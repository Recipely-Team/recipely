import type { CreatorPlatformType } from '@domain/creators/creator-platform';

/** What the Edit Profile creator form sends: a picked platform and the handle as typed. */
export interface RequestCreatorTagInput {
  platform: CreatorPlatformType;
  /** Raw — `@` and capitals are fine; the use case normalises it. */
  handle: string;
}
