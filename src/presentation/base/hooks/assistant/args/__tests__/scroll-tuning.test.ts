import { AssistantScrollDirection } from '@presentation/base/hooks/assistant/args/assistant-scroll-direction';
import { scrollTargetFor } from '@presentation/base/hooks/assistant/args/scroll-tuning';

/**
 * One piece of arithmetic for every screen. The feed and the recipe detail
 * each carried their own copy of this ternary and their own step share, so
 * "go back to the top" could have meant something different on each.
 */
describe('scrollTargetFor', () => {
  const HEIGHT = 1000;
  const STEP = 850;

  it('moves just under a viewport, so a sliver of the last screen stays', () => {
    expect(scrollTargetFor(AssistantScrollDirection.Down, 0, HEIGHT)).toBe(STEP);
  });

  it('goes back up by the same step', () => {
    expect(scrollTargetFor(AssistantScrollDirection.Up, 2000, HEIGHT)).toBe(2000 - STEP);
  });

  // "Scroll up" at the top must not ask for a negative offset — iOS honours it
  // and leaves the list hanging below its own header.
  it('never asks for a negative offset', () => {
    expect(scrollTargetFor(AssistantScrollDirection.Up, 100, HEIGHT)).toBe(0);
  });

  it('jumps to the ends', () => {
    expect(scrollTargetFor(AssistantScrollDirection.Top, 5000, HEIGHT)).toBe(0);
    expect(scrollTargetFor(AssistantScrollDirection.Bottom, 0, HEIGHT)).toBe(Number.MAX_SAFE_INTEGER);
  });
});
