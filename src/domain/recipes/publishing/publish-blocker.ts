/**
 * What still stands between a recipe read from a website and publishing it.
 *
 * A site's photo and its wording belong to the site, so a web import is shared
 * with the cook's own photo and in their own words. The backend lists what is
 * still missing; the owner's checklist is drawn from it.
 */
export const PublishBlocker = {
  Photo: 'photo',
  Ingredients: 'ingredients',
  Instructions: 'instructions',
} as const;

export type PublishBlockerType = (typeof PublishBlocker)[keyof typeof PublishBlocker];
