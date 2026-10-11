/** Where the fridge flow is: the three numbered steps, the scan in between, and the two full-screen states. */
export const FridgeStep = {
  Capture: 'capture',
  Analysing: 'analysing',
  Ingredients: 'ingredients',
  Ideas: 'ideas',
  NothingFound: 'nothingFound',
  Limit: 'limit',
} as const;

export type FridgeStepType = (typeof FridgeStep)[keyof typeof FridgeStep];
