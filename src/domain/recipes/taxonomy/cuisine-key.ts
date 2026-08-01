export const CuisineKey = {
  Turkish: 'TURKISH',
  Italian: 'ITALIAN',
  Mexican: 'MEXICAN',
  Chinese: 'CHINESE',
  Japanese: 'JAPANESE',
  Indian: 'INDIAN',
  French: 'FRENCH',
  Greek: 'GREEK',
  American: 'AMERICAN',
  Mediterranean: 'MEDITERRANEAN',
  Thai: 'THAI',
  Spanish: 'SPANISH',
  Korean: 'KOREAN',
  MiddleEastern: 'MIDDLE_EASTERN',
  Other: 'OTHER',
} as const;

// eslint-disable-next-line @typescript-eslint/no-redeclare -- intentional enum-style value + type pairing
export type CuisineKey = (typeof CuisineKey)[keyof typeof CuisineKey];

export const CUISINE_KEY_VALUES: readonly CuisineKey[] = [
  CuisineKey.Turkish,
  CuisineKey.Italian,
  CuisineKey.Mexican,
  CuisineKey.Chinese,
  CuisineKey.Japanese,
  CuisineKey.Indian,
  CuisineKey.French,
  CuisineKey.Greek,
  CuisineKey.American,
  CuisineKey.Mediterranean,
  CuisineKey.Thai,
  CuisineKey.Spanish,
  CuisineKey.Korean,
  CuisineKey.MiddleEastern,
  CuisineKey.Other,
];
