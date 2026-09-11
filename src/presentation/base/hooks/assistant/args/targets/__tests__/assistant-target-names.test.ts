import {
  ASSISTANT_NAVIGATION_TARGETS,
  resolveAssistantScreenName,
} from '@presentation/base/hooks/assistant/args/targets/assistant-navigation-targets';
import { ASSISTANT_EXTERNAL_NAMES, isAssistantExternalName } from '@presentation/base/hooks/assistant/args/targets/assistant-external-targets';
import { foldTargetName } from '@presentation/base/hooks/assistant/args/targets/fold-target-name';

/**
 * Measured on production: asked "open my recipes" through Siri, the Groq
 * fallback answered `navigate` with "My Recipes" — the label, not the key — and
 * the app came forward only to refuse it as `unknown_screen`. The model is given
 * the keys and is not held to them.
 */
describe('assistant target names — the words a model actually sends', () => {
  it.each([
    ['My Recipes', 'myRecipes'],
    ['my recipes', 'myRecipes'],
    ['my_recipes', 'myRecipes'],
    ['MYRECIPES', 'myRecipes'],
    ['Edit Profile', 'editProfile'],
    ['create-recipe', 'createRecipe'],
    ['settings', 'settings'],
  ])('resolves "%s" to the %s key', (spoken, key) => {
    expect(resolveAssistantScreenName(spoken)).toBe(key);
  });

  it('still refuses a word that names no screen', () => {
    expect(resolveAssistantScreenName('Tariflerim')).toBeNull();
    expect(resolveAssistantScreenName('')).toBeNull();
  });

  // Folding case and separators must never merge two keys into one, or a word
  // would open whichever of them the map happened to keep.
  it('folds every screen key to a name no other key shares', () => {
    const keys = Object.keys(ASSISTANT_NAVIGATION_TARGETS);
    expect(new Set(keys.map(foldTargetName)).size).toBe(keys.length);
  });

  // Outside pages are checked first, so one that folded onto a screen key would
  // silently hide that screen.
  it('keeps every outside page apart from every screen once folded', () => {
    const screens = new Set(Object.keys(ASSISTANT_NAVIGATION_TARGETS).map(foldTargetName));
    expect(ASSISTANT_EXTERNAL_NAMES.map(foldTargetName).filter((name) => screens.has(name))).toEqual([]);
  });

  it('recognises an outside page however the model spelled it', () => {
    expect(isAssistantExternalName('Privacy Policy')).toBe(true);
    expect(isAssistantExternalName('terms_of_use')).toBe(true);
    expect(isAssistantExternalName('recipes')).toBe(false);
  });
});
