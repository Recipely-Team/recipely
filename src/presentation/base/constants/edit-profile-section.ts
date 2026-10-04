/**
 * The `?section=` an Edit Profile link can open on. One value today: the
 * creator account section, where a creator notification lands.
 */
export const EditProfileSection = {
  CreatorAccount: 'creator',
} as const;

export type EditProfileSectionType = (typeof EditProfileSection)[keyof typeof EditProfileSection];
