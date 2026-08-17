import type { TabType } from '@presentation/app/my-recipes/model/tab-type';

/**
 * One entry in the My-Recipes tab row, as the screen hands it to whichever tab
 * bar is mounted — the mobile one or the web one. The icon is not here: it
 * belongs to the tab, not to this render, so both bars read it from
 * {@link TabIcons}.
 */
export interface MyRecipesTab {
  key: TabType;
  label: string;
  count: number;
}
