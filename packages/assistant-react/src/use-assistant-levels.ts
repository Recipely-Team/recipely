import type { LevelSource } from '@live-assistant/core';
import { useAssistantController } from './use-assistant-controller';

/**
 * The two level sources, for an animation library that polls on its own clock.
 *
 * `input` is the user (silent while muted, or while the microphone is held
 * shut over the assistant's voice); `output` is what the user is hearing. Both
 * are 0–1 and cheap to read every frame. Reading them never re-renders.
 */
export function useAssistantLevels(): { readonly input: LevelSource; readonly output: LevelSource } {
  const controller = useAssistantController();
  return { input: controller.inputLevel, output: controller.outputLevel };
}
