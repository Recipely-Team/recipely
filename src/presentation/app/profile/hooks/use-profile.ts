import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useStores } from '@presentation/bootstrap/use-stores';
import { failureToastMessage } from '@presentation/base/errors/failure-lookups';
import { useAvatarUpload } from '@presentation/base/hooks/profile/use-avatar-upload';
import type { ProfileStatsState } from '@presentation/app/profile/model/profile-stats-state';
import { CharConstants, ValueConstants } from '@core/constants';
import { RoutePaths } from '@presentation/base/constants';

/** View model returned by {@link useProfile} for the profile screen. */
interface UseProfileResult {
  displayName: string;
  handle: string;
  bio: string;
  photoUri: string | undefined;
  isUploading: boolean;
  onPickAvatar: () => void;
  onEditProfile: () => void;
  stats: ProfileStatsState;
  /** Localized message for the avatar upload-failure dialog; null when there is none. */
  uploadError: string | null;
  onDismissUploadError: () => void;
}

/**
 * Orchestrates the profile screen: exposes the signed-in user's identity
 * fields, lazily loads the profile stats (recipes / likes / views / saved) and
 * models that fetch as a discriminated union, and wires the avatar upload and
 * edit-profile navigation intents.
 */
export const useProfile = (): UseProfileResult => {
  const router = useRouter();
  const { pickAndUpload, isUploading, uploadError, onDismissUploadError } = useAvatarUpload();

  const { authStore, userProfileStore, savedRecipesStore } = useStores();
  const authState = authStore((s) => s.state);
  const profileState = userProfileStore((s) => s.state);
  const loadProfile = userProfileStore((s) => s.load);
  const savedCount = savedRecipesStore((s) => s.savedIds.size);

  const user = authState.status === 'authenticated' ? authState.session.user : null;
  const userId = user?.id;
  const displayName = user?.displayName ?? CharConstants.empty;
  const email = user?.email.value ?? CharConstants.empty;
  const photoUri = user?.photoUrl ?? undefined;
  const handle = email.split('@')[ValueConstants.zero];
  const bio = user?.bio?.trim() ?? CharConstants.empty;

  useEffect(() => {
    if (userId !== undefined && profileState.status === 'idle') {
      void loadProfile(userId);
    }
  }, [userId, profileState.status, loadProfile]);

  const retry = (): void => {
    if (userId !== undefined) void loadProfile(userId);
  };

  const stats = ((): ProfileStatsState => {
    switch (profileState.status) {
      case 'loading':
        return { status: 'loading' };
      case 'error':
        return {
          status: 'error',
          message: failureToastMessage(profileState.failure),
          onRetry: retry,
        };
      case 'loaded':
        return {
          status: 'loaded',
          recipeCount: profileState.profile.recipeCount,
          totalLikes: profileState.profile.totalLikes,
          totalViews: profileState.profile.totalViews,
          savedCount,
        };
      default:
        return { status: 'idle' };
    }
  })();

  return {
    displayName,
    handle,
    bio,
    photoUri,
    isUploading,
    onPickAvatar: () => void pickAndUpload(),
    onEditProfile: () => router.push(RoutePaths.editProfile),
    stats,
    uploadError,
    onDismissUploadError,
  };
};
