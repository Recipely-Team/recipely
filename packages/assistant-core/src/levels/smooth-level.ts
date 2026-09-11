/**
 * Eases a drawn level towards a new reading: quick to rise, slower to fall.
 *
 * Raw levels jump between 20 ms slices; drawn as they are, an orb flickers.
 * A fast attack keeps the first syllable crisp and a slower release stops the
 * shape collapsing between words. Frame-rate independent: `elapsedSeconds` is
 * the time since the previous frame, so 30 and 120 fps look the same.
 */
const ATTACK_SECONDS = 0.05;
const RELEASE_SECONDS = 0.25;

export function smoothLevel(previous: number, next: number, elapsedSeconds: number): number {
  const timeConstant = next > previous ? ATTACK_SECONDS : RELEASE_SECONDS;
  const blend = 1 - Math.exp(-Math.max(0, elapsedSeconds) / timeConstant);
  return previous + (next - previous) * blend;
}
