import { CuisineKey } from '@domain/recipes/taxonomy/cuisine-key';

/** Single source of truth mapping each cuisine key to its display emoji. */
export const CUISINE_EMOJI: Record<CuisineKey, string> = {
  [CuisineKey.Turkish]: '🥙',
  [CuisineKey.Italian]: '🍕',
  [CuisineKey.Mexican]: '🌮',
  [CuisineKey.Chinese]: '🥟',
  [CuisineKey.Japanese]: '🍣',
  [CuisineKey.Indian]: '🍛',
  [CuisineKey.French]: '🥐',
  [CuisineKey.Greek]: '🫒',
  [CuisineKey.American]: '🍔',
  [CuisineKey.Mediterranean]: '🍋',
  [CuisineKey.Thai]: '🍜',
  [CuisineKey.Spanish]: '🥘',
  [CuisineKey.Korean]: '🍱',
  [CuisineKey.MiddleEastern]: '🧆',
  [CuisineKey.Other]: '🍽️',
};
