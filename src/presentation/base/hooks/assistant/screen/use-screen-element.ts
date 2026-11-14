import { useContext, useEffect, useEffectEvent } from 'react';
import { NavigationContext } from 'expo-router/react-navigation';
import type { ScreenElementKind } from '@domain/assistant/screen/screen-element-kind';
import { ScreenElementsContext } from '@presentation/base/hooks/assistant/screen/screen-elements-context';

interface ScreenElementView {
  readonly label: string;
  readonly isEnabled?: boolean;
  readonly press?: () => void;
}

/**
 * Puts the calling text or control on the assistant's view of the screen.
 *
 * @remarks
 * - **Registered once per mount**; the label, enabled state and handler are read
 *   when the assistant looks, through an Effect Event, so a re-render costs nothing.
 * - **Visible means its screen is focused.** The screen's navigation object is
 *   asked at read time; an element outside every screen (a root sheet, a dialog,
 *   the tab bar) is always on screen.
 * - **No subscription per element**: one context read, one effect.
 */
export const useScreenElement = (kind: ScreenElementKind, view: () => ScreenElementView): void => {
  const registry = useContext(ScreenElementsContext);
  const navigation = useContext(NavigationContext);
  const current = useEffectEvent(view);

  useEffect(() => {
    if (registry === null) return;
    return registry.register({
      kind,
      label: () => current().label,
      isVisible: () => navigation?.isFocused() ?? true,
      isEnabled: () => current().isEnabled ?? true,
      press: () => current().press?.(),
    });
  }, [registry, navigation, kind]);
};
