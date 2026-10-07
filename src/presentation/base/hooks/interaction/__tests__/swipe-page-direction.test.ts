import { swipePageDirection } from '@presentation/base/hooks/interaction/swipe-page-direction';

/**
 * Review finding: a left swipe always paged forward, so in Arabic (RTL) cook
 * mode's steps and the diary week strip paged against the mirrored UI.
 */
describe('swipePageDirection', () => {
  it('pages forward on a left swipe in a left-to-right layout', () => {
    expect([swipePageDirection(-80, false), swipePageDirection(80, false)]).toEqual([1, -1]);
  });

  it('pages forward on a right swipe in a right-to-left layout', () => {
    expect([swipePageDirection(80, true), swipePageDirection(-80, true)]).toEqual([1, -1]);
  });
});
