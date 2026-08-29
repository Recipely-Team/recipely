import { scrollTargetFor } from '@presentation/base/hooks/assistant/args/scrolling/scroll-tuning';
import { AssistantScrollDirection } from '@presentation/base/hooks/assistant/args/scrolling/assistant-scroll-direction';

/**
 * "Sayfayı biraz daha aşağı kaydır" did nothing on the wide-layout feed, three
 * times in a row, while the assistant reported a scroll each time — and "en
 * alta kaydır" worked.
 *
 * That pair is the whole diagnosis. `top` and `bottom` are FIXED targets and do
 * not consult the current position; `up` and `down` are measured FROM it. The
 * web feed had the scroll handle attached but no `onScroll`, so the offset it
 * stepped from was zero forever: every "down" resolved to the same absolute
 * point, which is a move the first time and nothing after.
 *
 * The shape fix is that a plain scroller now takes one object carrying the
 * handle and the offset together. These pin the arithmetic that made a missing
 * offset invisible rather than loud.
 */
const VIEWPORT = 800;

describe('relative scrolling reads the current position', () => {
  it('steps down from where the list actually is, not from zero', () => {
    const fromTop = scrollTargetFor(AssistantScrollDirection.Down, 0, VIEWPORT);
    const fromMiddle = scrollTargetFor(AssistantScrollDirection.Down, 2_400, VIEWPORT);

    expect(fromMiddle).toBeGreaterThan(fromTop);
    expect(fromMiddle).toBeGreaterThan(2_400);
  });

  it('steps up from where the list actually is', () => {
    expect(scrollTargetFor(AssistantScrollDirection.Up, 2_400, VIEWPORT)).toBeLessThan(2_400);
    expect(scrollTargetFor(AssistantScrollDirection.Up, 2_400, VIEWPORT)).toBeGreaterThan(0);
  });

  // The symptom, stated directly: with a frozen offset every "down" lands in
  // the same place, so the second one cannot move anything.
  it('returns the SAME target twice when the offset never updates', () => {
    const first = scrollTargetFor(AssistantScrollDirection.Down, 0, VIEWPORT);
    const second = scrollTargetFor(AssistantScrollDirection.Down, 0, VIEWPORT);

    expect(second).toBe(first);
  });

  // ...which is why these two kept working and hid the problem.
  it('ignores the offset for the fixed targets, which is why they never broke', () => {
    expect(scrollTargetFor(AssistantScrollDirection.Top, 0, VIEWPORT)).toBe(
      scrollTargetFor(AssistantScrollDirection.Top, 9_999, VIEWPORT),
    );
    expect(scrollTargetFor(AssistantScrollDirection.Bottom, 0, VIEWPORT)).toBe(
      scrollTargetFor(AssistantScrollDirection.Bottom, 9_999, VIEWPORT),
    );
  });
});
