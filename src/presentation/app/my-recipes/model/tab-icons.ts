import type { MaterialCommunityIcons } from '@expo/vector-icons';
import { TabType } from '@presentation/app/my-recipes/model/tab-type';

type MaterialIconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

/**
 * The glyph each My-Recipes tab is known by — the bookmark that saves a recipe,
 * the heart that likes it, the fork that means "mine", the pencil for a draft.
 *
 * One map, read by both tab bars and by the matching empty state, so a tab
 * cannot end up wearing one icon in the row and a different one over its empty
 * grid.
 */
export const TabIcons: Record<TabType, MaterialIconName> = {
  [TabType.Saved]: 'bookmark-outline',
  [TabType.Liked]: 'heart-outline',
  [TabType.Created]: 'silverware-fork-knife',
  [TabType.Drafts]: 'file-document-edit-outline',
};
