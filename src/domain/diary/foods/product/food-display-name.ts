import { CharConstants, ValueConstants } from '@core/constants';

/** The parts a product's name is composed from. */
interface FoodNameParts {
  name: string;
  variantName: string | null;
  variantCount: number;
  brand: string | null;
}

/**
 * How a product reads in a row and in the diary: `Ayran · Az yağlı` (the
 * variant only when there is more than one), `Sütaş Ayran` (the brand in
 * front unless the name already carries it).
 */
export const foodDisplayName = ({ name, variantName, variantCount, brand }: FoodNameParts): string => {
  const branded =
    brand !== null && brand.length > ValueConstants.zero && !name.toLowerCase().includes(brand.toLowerCase())
      ? `${brand}${CharConstants.space}${name}`
      : name;
  return variantCount > ValueConstants.one && variantName !== null && variantName.length > ValueConstants.zero
    ? `${branded}${CharConstants.middotSpaced}${variantName}`
    : branded;
};
