/** How sure the scan is that an ingredient is really in the photo. */
export const FridgeConfidence = {
  High: 'high',
  Low: 'low',
} as const;

export type FridgeConfidenceType = (typeof FridgeConfidence)[keyof typeof FridgeConfidence];
