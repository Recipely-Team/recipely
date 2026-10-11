import { useEffect, useRef, useState } from 'react';
import { useNavigation } from 'expo-router';
import { type NavigationAction, usePreventRemove } from 'expo-router/react-navigation';

interface LeaveGuard {
  /** Lets the held gesture through — call it once the user answered "save" or "discard". */
  release: () => void;
}

/**
 * Holds the system's own back — the Android back button or gesture, the iOS
 * edge swipe — while `shouldAsk` is true, and calls `onAsk` instead, so a
 * screen can show its "keep or discard" question. `release()` lifts the guard
 * and replays the held gesture; the guard is lifted FIRST, or the replay would
 * be stopped again.
 *
 * @remarks
 * - **Why**: create-recipe and edit-profile asked only from their own close
 *   button; a back gesture left with the work gone.
 */
export const useLeaveGuard = (shouldAsk: boolean, onAsk: () => void): LeaveGuard => {
  const navigation = useNavigation();
  const [released, setReleased] = useState(false);
  const held = useRef<NavigationAction | null>(null);

  usePreventRemove(shouldAsk && !released, ({ data }) => {
    held.current = data.action;
    onAsk();
  });

  useEffect(() => {
    if (!released || held.current === null) return;
    const action = held.current;
    held.current = null;
    navigation.dispatch(action);
  }, [released, navigation]);

  return { release: () => setReleased(true) };
};
