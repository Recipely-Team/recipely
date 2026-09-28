import { useContext, useEffect, useState } from 'react';
import { NavigationContext } from 'expo-router/react-navigation';

/**
 * Whether the screen this is rendered inside is the one the user is looking at.
 *
 * @remarks
 * - **Mounted is not visible.** expo-router leaves the screen underneath a push
 *   mounted, and every tab keeps its screen mounted once visited. Anything that
 *   scoped itself to mount therefore went on acting long after the user had
 *   moved on — which is a bug with a name: the create screen kept answering
 *   `generateRecipe` with "there is an open draft" from under the feed, so the
 *   assistant refused to make a recipe and the user could see no draft to save
 *   or delete.
 * - **Outside a screen it answers yes.** The root layout's own chrome — the
 *   assistant pill, the timers bar — is rendered beside the navigator rather
 *   than inside a screen, so there is no route to be focused or blurred and
 *   `NavigationContext` is undefined. Those handlers are global on purpose and
 *   must not be switched off by this.
 * - **`useContext`, not `useIsFocused`.** The hook from React Navigation throws
 *   where there is no route, which is exactly where the always-mounted chrome
 *   calls it from.
 */
export const useIsScreenFocused = (): boolean => {
  const navigation = useContext(NavigationContext);
  const [isFocused, setIsFocused] = useState(() => navigation?.isFocused() ?? true);

  useEffect(() => {
    if (navigation === undefined) return;

    setIsFocused(navigation.isFocused());
    const stopListeningToFocus = navigation.addListener('focus', () => setIsFocused(true));
    const stopListeningToBlur = navigation.addListener('blur', () => setIsFocused(false));
    return () => {
      stopListeningToFocus();
      stopListeningToBlur();
    };
  }, [navigation]);

  return isFocused;
};
