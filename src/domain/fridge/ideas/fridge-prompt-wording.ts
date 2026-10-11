/**
 * The words a fridge prompt is written in — supplied by presentation in the
 * user's language, because the prompt is shown back to them (the refine
 * transcript's first line, the prompt box after a failed generation).
 */
export interface FridgePromptWording {
  /** "Make “{title}”: {summary}" */
  dish: (title: string, summary: string) => string;
  /** "Ingredients I have: {list}" */
  have: (list: string) => string;
  /** "I would still need: {list}" */
  missing: (list: string) => string;
  /** "Ready in {n} minutes or less" */
  maxTime: (minutes: number) => string;
  /** "Diet: {diet}" */
  diet: (dietLabel: string) => string;
  /** "For {n} servings" */
  servings: (servings: number) => string;
}
