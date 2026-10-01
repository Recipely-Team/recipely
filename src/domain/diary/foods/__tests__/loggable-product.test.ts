import { CalendarDate } from '@domain/diary/calendar/calendar-date';
import { MealSlot } from '@domain/diary/meal-slot';
import { nutrientsOf } from '@domain/diary/__fixtures__/nutrients-of';
import { foodLogEntryOf } from '@domain/diary/__fixtures__/food-log-entry-of';
import { FoodProduct } from '@domain/diary/foods/product/food-product';
import { foodDisplayName } from '@domain/diary/foods/product/food-display-name';
import { FoodQuantity } from '@domain/diary/foods/units/food-quantity';

const ayran = FoodProduct.of({
  source: 'curated', foodId: 'f1', foodVariantId: 'v2', offBarcode: null, kind: 'drink', category: 'dairy', name: 'Ayran',
  variantName: 'Az yağlı', variantCount: 3, brand: null, packSize: null, unit: 'ml',
  per100: nutrientsOf({ calories: 26, protein: 1.5, carbs: 2, fat: 1, fiber: 0 }), servingUnits: [{ key: 'glass', amount: 200 }], imageUrl: null,
});

describe('product names', () => {
  it('appends the variant only when there is more than one, and puts the brand in front once', () => {
    expect(foodDisplayName({ name: 'Ayran', variantName: 'Az yağlı', variantCount: 3, brand: null })).toBe('Ayran · Az yağlı');
    expect(foodDisplayName({ name: 'Ayran', variantName: 'Klasik', variantCount: 1, brand: null })).toBe('Ayran');
    expect(foodDisplayName({ name: 'Ayran', variantName: null, variantCount: 1, brand: 'Sütaş' })).toBe('Sütaş Ayran');
    expect(foodDisplayName({ name: 'Sütaş Ayran', variantName: null, variantCount: 1, brand: 'Sütaş' })).toBe('Sütaş Ayran');
  });
});

describe('LoggableProduct', () => {
  it('totals the chosen quantity from per-100 figures', () => {
    const product = ayran.loggable;
    const twoGlasses = FoodQuantity.of({ key: 'glass', amount: 200 }, 2);
    const total = product.nutrientsFor(twoGlasses);
    expect(total.calories).toBeCloseTo(104);
    expect(total.protein).toBeCloseTo(6);
    expect(product.units.map((u) => u.key)).toEqual(['glass', 'ml']);
  });

  it('builds a product entry: servings is the quantity, nutrients the totals, the unit travels with it', () => {
    const entry = ayran.loggable.entryFor(CalendarDate.of(2026, 9, 30), MealSlot.Lunch, FoodQuantity.of({ key: 'ml', amount: 1 }, 250));
    expect(entry.servings).toBe(250);
    expect(entry.nutrients.calories).toBeCloseTo(65);
    expect(entry.recipeId).toBeNull();
    expect(entry.product).toEqual({ source: 'curated', foodVariantId: 'v2', offBarcode: null, unitKey: 'ml', unitAmount: 1 });
  });

  it('reopens a logged product entry at its unit and quantity, with the same per-unit figures', () => {
    const entry = foodLogEntryOf({
      name: 'Ayran · Az yağlı',
      servings: 1.5,
      nutrients: nutrientsOf({ calories: 78 }),
      recipeId: null,
      product: { source: 'curated', foodVariantId: 'v2', offBarcode: null, unitKey: 'glass', unitAmount: 200 },
    });
    const logged = entry.loggedProduct;
    expect(entry.isQuickAdd).toBe(false);
    expect(logged?.quantity.value).toBe(1.5);
    expect(logged?.product.nutrientsFor(logged.quantity.increment()).calories).toBeCloseTo(104);
  });

  it('lets a product entry hold more than 20 of its unit', () => {
    expect(() =>
      foodLogEntryOf({ servings: 500, recipeId: null, product: { source: 'curated', foodVariantId: 'v', offBarcode: null, unitKey: 'ml', unitAmount: 1 } }),
    ).not.toThrow();
    expect(() => foodLogEntryOf({ servings: 21 })).toThrow();
  });
});
