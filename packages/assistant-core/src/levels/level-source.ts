/**
 * Something that can say how loud it is right now, on a 0–1 scale.
 *
 * @remarks
 * - **Pulled, never pushed.** Levels change dozens of times a second; a value
 *   pushed into React state re-renders every subscriber that often. An
 *   animation reads `level()` on its own frame clock (a Reanimated frame
 *   callback, `requestAnimationFrame`) and nothing re-renders.
 * - **Cheap enough to call every frame.** Implementations answer from a
 *   precomputed timeline; they do no audio maths on read.
 */
export interface LevelSource {
  level(): number;
}
