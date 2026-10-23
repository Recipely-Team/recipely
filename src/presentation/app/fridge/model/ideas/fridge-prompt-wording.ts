import type { TranslationsType } from '@presentation/i18n';
import type { FridgePromptWording } from '@domain/fridge/ideas/fridge-prompt-wording';

/** The prompt's words in the user's language, for the domain's `fridgeIdeaPrompt`. */
export const fridgePromptWording = (t: TranslationsType): FridgePromptWording => {
  const copy = t.fridge;
  return {
    dish: (title, summary) => copy.promptDish.replace('{title}', title).replace('{summary}', summary),
    have: (list) => copy.promptHave.replace('{list}', list),
    missing: (list) => copy.promptMissing.replace('{list}', list),
    maxTime: (minutes) => copy.promptMaxTime.replace('{n}', String(minutes)),
    diet: (diet) => copy.promptDiet.replace('{diet}', diet),
    servings: (servings) => copy.promptServings.replace('{n}', String(servings)),
  };
};
