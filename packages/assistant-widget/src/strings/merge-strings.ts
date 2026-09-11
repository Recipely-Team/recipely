import type { AssistantStrings } from './assistant-strings';
import { defaultStrings } from './default-strings';

/** A strings override one level deep: `{ status: { listening } }` keeps every other status. */
export type AssistantStringsOverride = Partial<Omit<AssistantStrings, 'status' | 'ended' | 'errors'>> & {
  readonly status?: Partial<AssistantStrings['status']>;
  readonly ended?: AssistantStrings['ended'];
  readonly errors?: AssistantStrings['errors'];
};

export function mergeStrings(override: AssistantStringsOverride = {}): AssistantStrings {
  return {
    ...defaultStrings,
    ...override,
    status: { ...defaultStrings.status, ...override.status },
    ended: { ...defaultStrings.ended, ...override.ended },
    errors: { ...defaultStrings.errors, ...override.errors },
  };
}
