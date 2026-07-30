import { TabType } from '@presentation/app/my-recipes/model/tab-type';

const TABS: readonly TabType[] = [TabType.Saved, TabType.Created, TabType.Drafts];

/**
 * Reads the `?tab=` deep-link parameter, falling back to the saved tab.
 *
 * Publishing a recipe lands here on `created`: a user who just made something
 * and is shown the saved tab instead reasonably concludes it was not saved.
 */
export const parseTabParam = (value: string | undefined): TabType =>
  TABS.find((tab) => tab === value) ?? TabType.Saved;
