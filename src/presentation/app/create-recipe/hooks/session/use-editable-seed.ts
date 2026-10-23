import { useEffect, useEffectEvent, useRef } from 'react';
import { useStore } from 'zustand';
import { StoreStatus } from '@application/store/store-status';
import { useStores } from '@presentation/bootstrap/use-stores';
import { showErrorToast } from '@presentation/base/feedback/show-toast';
import { useGoBackOrHome } from '@presentation/base/hooks/navigation/use-go-back-or-home';
import { fromRecipeIdOf } from '@presentation/app/create-recipe/model/drafting/from-recipe-id-of';
import { recipeToEditable } from '@presentation/app/create-recipe/model/drafting/recipe-to-editable';
import { editableToSnapshot } from '@presentation/app/create-recipe/model/drafting/editable-to-snapshot';
import type { EditableRecipe } from '@presentation/app/create-recipe/model/drafting/editable-recipe';
import { CharConstants } from '@core/constants';

/** Where the editor's first contents come from, when they come from a recipe that exists. */
interface EditableSeedArgs {
  /** A saved private recipe being edited. */
  editRecipeId: string | undefined;
  /** A recipe to copy (the assistant's "make this again"). */
  fromRecipeId: string | undefined;
  draftId: string | undefined;
  /** Shared with the `?prompt=` start: true for whichever asks first, so only one of them starts the editor. */
  claimStart: () => boolean;
  /** `openedAs` is what "unchanged" is measured against on leaving; a copy has none. */
  onSeed: (recipe: EditableRecipe, openedAs: string | null) => void;
}

/**
 * Fills the editor from a recipe that already exists — one being edited, or one being copied.
 *
 * @remarks
 * - **Editing a saved recipe is not a draft.** `?editRecipeId=` seeds the
 *   editor from the recipe itself (photos included, for display); a recipe
 *   that cannot be read is reported and the editor closes.
 * - **A copy is a copy.** Asked to make the same recipe, the assistant used to
 *   hand the words to the generator, which invented something adjacent — a
 *   different ingredient list, different times, a different name. The fields
 *   are read from the recipe itself and the user edits from there.
 * - **Media is deliberately NOT carried over** in a copy. The photographs
 *   belong to whoever took them, and a copy that arrives wearing someone
 *   else's picture is a claim the user did not make.
 * - **Seeded once.** A later change to the cached recipe would otherwise throw
 *   away whatever the user had edited.
 */
export const useEditableSeed = ({ editRecipeId, fromRecipeId, draftId, claimStart, onSeed }: EditableSeedArgs): void => {
  const goBackOrHome = useGoBackOrHome();
  const { recipeDetailStore } = useStores();
  const loadRecipeDetail = useStore(recipeDetailStore, (st) => st.load);
  const copiedFrom = useStore(recipeDetailStore, (st) => fromRecipeIdOf(st.byId, fromRecipeId));
  const editing = useStore(recipeDetailStore, (st) => fromRecipeIdOf(st.byId, editRecipeId));
  const editState = useStore(recipeDetailStore, (st) => (editRecipeId === undefined ? undefined : st.byId[editRecipeId]));
  const isSeeded = useRef(false);
  const seed = useEffectEvent(onSeed);
  const claim = useEffectEvent(claimStart);

  useEffect(() => {
    if (editRecipeId === undefined) return;
    void loadRecipeDetail(editRecipeId);
  }, [editRecipeId, loadRecipeDetail]);

  useEffect(() => {
    if (editState?.status !== StoreStatus.Error) return;
    showErrorToast(editState.failure);
    goBackOrHome();
  }, [editState, goBackOrHome]);

  useEffect(() => {
    if (editing === null || isSeeded.current) return;
    isSeeded.current = true;
    const opened = recipeToEditable(editing, []);
    seed(opened, JSON.stringify(editableToSnapshot(opened, undefined)));
  }, [editing]);

  useEffect(() => {
    if (fromRecipeId === undefined || fromRecipeId === CharConstants.empty) return;
    if (draftId !== undefined || editRecipeId !== undefined || !claim()) return;
    void loadRecipeDetail(fromRecipeId);
  }, [fromRecipeId, draftId, editRecipeId, loadRecipeDetail]);

  useEffect(() => {
    if (copiedFrom === null || isSeeded.current) return;
    isSeeded.current = true;
    seed(recipeToEditable(copiedFrom, []), null);
  }, [copiedFrom]);
};
