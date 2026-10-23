import type { RecipeDraft } from '@domain/drafts/recipe-draft';
import type { EditableRecipe } from '@presentation/app/create-recipe/model/drafting/editable-recipe';
import { machineLower } from '@presentation/base/hooks/assistant/args/resolving/machine-case';
import { SCREEN_PART_SEPARATOR } from '@presentation/base/hooks/assistant/args/describing/screen-line';
import { CharConstants } from '@core/constants';

/** What the screen line says while the editor has not been reached yet. */
const NO_DRAFT = 'draft=none';
/** A generated draft can reach the editor before it has been given a name. */
const NO_NAME = 'untitled';

/** What the screen line says before the editor: nothing open, and what is on offer. */
export function resumeLine(draft: RecipeDraft | null): string {
  return draft === null
    ? NO_DRAFT
    : [NO_DRAFT, `resumable=${draftTitle(draft)}`].join(SCREEN_PART_SEPARATOR);
}

/** The draft's name, or a stand-in: a generated draft reaches the editor unnamed. */
export function draftName(recipe: EditableRecipe): string {
  return recipe.name === CharConstants.empty ? NO_NAME : recipe.name;
}

/** The numbers printed beside the draft, for the reading only. */
export function draftFacts(recipe: EditableRecipe): string[] {
  return [
    `servings=${recipe.servings}`,
    `prep=${recipe.prepTimeMinutes}`,
    `cook=${recipe.cookTimeMinutes}`,
    `difficulty=${recipe.difficulty}`,
  ];
}

/** The resumable draft's name, or the same stand-in. */
export function draftTitle(draft: RecipeDraft): string {
  const name = draft.snapshot.name?.trim() ?? CharConstants.empty;
  return name === CharConstants.empty ? NO_NAME : name;
}

/**
 * Whether what the model said refers to the one draft on offer.
 *
 * Loose on purpose: the model passes back the words it heard, and "the lentil
 * soup" is how a person names "Mercimek çorbası (taslak)". An empty argument —
 * "continue my draft" — is the common case and always matches.
 */
export function namesTheDraft(arg: string | undefined, draft: RecipeDraft): boolean {
  const said = machineLower(arg ?? CharConstants.empty);
  if (said === CharConstants.empty) return true;
  const name = machineLower(draftTitle(draft));
  return name.includes(said) || said.includes(name);
}
