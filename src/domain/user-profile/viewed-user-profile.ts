import type { UserProfileEntity } from '@domain/user-profile/user-profile-entity';

/**
 * A public profile as one viewer sees it: the profile, plus how the viewer
 * stands towards it.
 *
 * @remarks
 * - **A read model, not entity fields.** Whether *I* follow someone is a fact
 *   about me, so it rides beside the `UserProfileEntity` rather than inside it
 *   (CLAUDE.md rule 19). A guest always reads `false`.
 * - **`followerCount` travels with it** because following changes it: the
 *   pair moves together, see `withFollowing`.
 */
export interface ViewedUserProfile {
  readonly profile: UserProfileEntity;
  readonly followerCount: number;
  readonly isFollowedByMe: boolean;
}
