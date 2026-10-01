import { useCallback, useRef } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { EditProfileSection } from '@presentation/base/constants';
import type { AssistantScrollableProps } from '@presentation/base/hooks/assistant/actions/assistant-scrollable-props';

type ScrollHandle = Parameters<AssistantScrollableProps['ref']>[0];

/** What the screen wires: a ref that also feeds the assistant's, and the creator section's layout callback. */
interface SectionScroll {
  ref: (instance: ScrollHandle) => void;
  onCreatorSectionLayout: (event: LayoutChangeEvent) => void;
}

/**
 * Scrolls Edit Profile to the creator account section when opened with
 * `?section=creator` — where a creator notification lands.
 *
 * @remarks
 * - **Once per visit:** a later re-layout (a row growing) must not yank the page back.
 * - **Shares the scroll view's ref with the assistant's**, through one stable
 *   callback, so neither replaces the other.
 */
export const useSectionScroll = (assistantRef: AssistantScrollableProps['ref']): SectionScroll => {
  const { section } = useLocalSearchParams<{ section?: string }>();
  const handle = useRef<ScrollHandle>(null);
  const done = useRef(false);

  const ref = useCallback(
    (instance: ScrollHandle) => {
      handle.current = instance;
      assistantRef(instance);
    },
    [assistantRef],
  );

  const onCreatorSectionLayout = useCallback(
    (event: LayoutChangeEvent) => {
      if (done.current || section !== EditProfileSection.CreatorAccount) return;
      done.current = true;
      handle.current?.scrollTo?.({ y: event.nativeEvent.layout.y, animated: true });
    },
    [section],
  );

  return { ref, onCreatorSectionLayout };
};
