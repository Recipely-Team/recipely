import { FridgeDiet, type FridgeDietType } from '@domain/fridge/ideas/fridge-diet';
import { t } from '@presentation/i18n';

/** A diet in the user's language — the chip label and the prompt's "Diet: …". */
export const dietLabel = (diet: FridgeDietType): string => {
  const copy = t().fridge;
  const labels: Readonly<Record<FridgeDietType, string>> = {
    [FridgeDiet.None]: copy.dietNone,
    [FridgeDiet.Vegetarian]: copy.dietVegetarian,
    [FridgeDiet.Vegan]: copy.dietVegan,
    [FridgeDiet.HighProtein]: copy.dietHighProtein,
  };
  return labels[diet];
};
