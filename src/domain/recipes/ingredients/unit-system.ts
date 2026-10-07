/** Which units the reader wants ingredient amounts in. */
export const UnitSystem = {
  /** As the recipe was written: amounts scale, units stay. */
  Original: 'original',
  Metric: 'metric',
  /** US customary: cups and spoons, ounces and pounds. */
  Imperial: 'imperial',
} as const;

export type UnitSystemType = (typeof UnitSystem)[keyof typeof UnitSystem];
