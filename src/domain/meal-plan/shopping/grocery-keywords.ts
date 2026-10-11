import { GroceryAisle, type GroceryAisleType } from '@domain/meal-plan/shopping/grocery-aisle';

/**
 * **The aisle keyword rules** — English and Turkish ingredient words, matched
 * against `groceryKey` of a name (so accents need not match). Until the
 * ingredient service answers an aisle, these are the one place one is decided.
 *
 * @remarks
 * - **The longest matching keyword wins**, across every aisle: "tereyağı"
 *   is Dairy, not the "yağ" of Spices & oils; "eggplant" is Produce, not the
 *   "egg" of Dairy; "black pepper" is a spice while "pepper" is Produce.
 * - **No match is Pantry.**
 * - **Staples** (salt, black pepper, oil) start unticked: most kitchens have them.
 * - **Skipped** lines are never bought: water. A name that IS one of them, or
 *   ends in one ("warm water", "ılık su"), is left out.
 */
export const GroceryKeywords: {
  readonly aisles: Readonly<Record<GroceryAisleType, readonly string[]>>;
  readonly staples: readonly string[];
  readonly skipped: readonly string[];
} = {
  aisles: {
    [GroceryAisle.Produce]: [
      'tomato', 'onion', 'garlic', 'potato', 'carrot', 'pepper', 'cucumber', 'lettuce', 'spinach', 'eggplant', 'zucchini',
      'lemon', 'lime', 'apple', 'banana', 'berry', 'parsley', 'dill', 'basil', 'cilantro', 'coriander leaves', 'mint leaves',
      'mushroom', 'broccoli', 'cabbage', 'celery', 'leek', 'avocado', 'ginger', 'olive', 'scallion', 'spring onion', 'herb',
      'domates', 'sogan', 'sarimsak', 'patates', 'havuc', 'biber', 'salatalik', 'marul', 'ispanak', 'patlican', 'kabak',
      'limon', 'elma', 'muz', 'maydanoz', 'dereotu', 'feslegen', 'mantar', 'brokoli', 'lahana', 'kereviz', 'pirasa',
      'zencefil', 'zeytin', 'taze sogan', 'roka', 'nane yapragi', 'cilek', 'portakal', 'nar',
    ],
    [GroceryAisle.Dairy]: [
      'milk', 'butter', 'cheese', 'yogurt', 'yoghurt', 'cream', 'egg', 'feta', 'parmesan', 'mozzarella', 'ricotta',
      'sut', 'tereyag', 'peynir', 'yogurt', 'krema', 'yumurta', 'kasar', 'lor', 'labne', 'kaymak', 'ayran',
    ],
    [GroceryAisle.Protein]: [
      'chicken', 'beef', 'lamb', 'pork', 'turkey', 'mince', 'ground meat', 'fish', 'salmon', 'tuna', 'shrimp', 'prawn',
      'tofu', 'tempeh', 'sausage', 'bacon',
      'tavuk', 'dana', 'kuzu', 'kiyma', 'et', 'balik', 'somon', 'ton baligi', 'karides', 'hindi', 'sucuk', 'pastirma',
    ],
    [GroceryAisle.Bakery]: [
      'bread', 'bun', 'tortilla', 'pita', 'baguette', 'breadcrumb', 'lavash',
      'ekmek', 'lavas', 'pide', 'yufka', 'galeta', 'bazlama', 'simit',
    ],
    [GroceryAisle.Pantry]: [
      'flour', 'sugar', 'rice', 'pasta', 'noodle', 'lentil', 'bean', 'chickpea', 'oat', 'stock', 'broth', 'honey',
      'vinegar', 'tomato paste', 'canned', 'baking powder', 'yeast', 'cocoa', 'chocolate', 'nut', 'almond', 'walnut',
      'un', 'seker', 'pirinc', 'makarna', 'mercimek', 'fasulye', 'nohut', 'bulgur', 'yulaf', 'bal', 'sirke',
      'salca', 'kabartma tozu', 'maya', 'kakao', 'cikolata', 'ceviz', 'badem', 'findik',
    ],
    [GroceryAisle.Spices]: [
      'salt', 'black pepper', 'paprika', 'cumin', 'oregano', 'thyme', 'cinnamon', 'turmeric', 'chili flakes',
      'chilli flakes', 'bay leaf', 'nutmeg', 'oil', 'olive oil', 'sesame oil', 'vanilla', 'spice',
      'tuz', 'karabiber', 'pul biber', 'kirmizi toz biber', 'kimyon', 'kekik', 'tarcin', 'zerdecal', 'defne',
      'yag', 'zeytinyagi', 'sivi yag', 'baharat', 'sumak', 'vanilin', 'kuru nane',
    ],
  },
  staples: ['salt', 'sea salt', 'black pepper', 'oil', 'olive oil', 'vegetable oil', 'tuz', 'karabiber', 'yag', 'zeytinyagi', 'sivi yag'],
  skipped: ['water', 'su'],
};
