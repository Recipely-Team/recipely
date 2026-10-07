import { useCallback } from 'react';
import { type Href, useRouter } from 'expo-router';
import { RoutePaths } from '@presentation/base/constants';

/** Opens cook mode for `recipeId`, pushed over the recipe page so Exit returns to it. */
export const useOpenCookMode = (recipeId: string): (() => void) => {
  const router = useRouter();
  return useCallback(() => router.push(RoutePaths.recipeCook(recipeId) as Href), [router, recipeId]);
};
