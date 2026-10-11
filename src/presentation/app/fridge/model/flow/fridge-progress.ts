import { FridgeStep, type FridgeStepType } from '@presentation/app/fridge/model/flow/fridge-step';

/** The header's "n/3" for each step: the scan and its outcomes belong to step 1. */
const NUMBER_BY_STEP: Readonly<Record<FridgeStepType, number>> = {
  [FridgeStep.Capture]: 1,
  [FridgeStep.Analysing]: 1,
  [FridgeStep.NothingFound]: 1,
  [FridgeStep.Limit]: 1,
  [FridgeStep.Ingredients]: 2,
  [FridgeStep.Ideas]: 3,
};

/** The flow's three-step progress: how many steps, and which one a step counts as. */
export const FridgeProgress = {
  total: 3,
  numberOf: (step: FridgeStepType): number => NUMBER_BY_STEP[step],
} as const;
