/**
 * Bodies of the `/diary/foods` endpoints written as the wire contract spells
 * them (backend #371 / #373, `recent-product.dto.ts`), as JSON text — never
 * built from this app's DTO types. A test that parses these proves the DTOs
 * and mappers read what the server sends, not what the client assumed it
 * sends (see docs/regressions.md → "a DTO written from the client's types").
 */
export const FoodsWireSamples = {
  recentPage: `{
    "items": [
      {
        "name": "Ayran · Az yağlı", "servings": 1.5, "calories": 78, "protein": 4.5, "carbs": 6, "fat": 3, "fiber": null,
        "recipeId": null, "recipeImageUrl": null,
        "product": {
          "source": "curated", "foodVariantId": "8a1f0c2e-0000-4000-8000-000000000002", "offBarcode": null,
          "unitKey": "glass", "unitAmount": 200, "foodId": "8a1f0c2e-0000-4000-8000-000000000001",
          "perUnit": { "kcal": 52, "protein": 3, "carbs": 4, "fat": 2, "fiber": null }
        }
      },
      {
        "name": "Menemen", "servings": 1, "calories": 300, "protein": 20, "carbs": 10, "fat": 15, "fiber": null,
        "recipeId": "r1", "recipeImageUrl": "https://cdn.test/m.jpg", "product": null
      }
    ],
    "total": 2, "page": 1, "pageSize": 20
  }`,
  searchFirstPage: `{
    "query": "ayran",
    "saved": { "items": [], "total": 0, "page": 1, "pageSize": 8 },
    "mine": {
      "items": [{
        "id": "r9", "name": "Ayranlı çorba", "image": null, "servings": 4, "caloriesPerServing": 180,
        "protein": 8, "carbs": 20, "fat": 6, "fiber": 1, "servingWeightGrams": null, "status": "pending", "isPublished": false
      }],
      "total": 1, "page": 1, "pageSize": 8
    },
    "products": {
      "items": [{
        "source": "curated", "foodId": "f1", "foodVariantId": "v2", "offBarcode": null, "kind": "drink", "category": "dairy",
        "name": "Ayran", "variantName": "Az yağlı", "variantCount": 3, "brand": null, "packSize": null, "unit": "ml",
        "per100": { "kcal": 26, "protein": 1.5, "carbs": 2, "fat": 1, "fiber": null },
        "servingUnits": [{ "key": "glass", "amount": 200 }], "imageUrl": null
      }, {
        "source": "openfoodfacts", "foodId": null, "foodVariantId": null, "offBarcode": "8690504012345", "kind": "drink",
        "category": null, "name": "Ayran", "variantName": null, "variantCount": 1, "brand": "Sütaş", "packSize": "300 ml",
        "unit": "ml", "per100": { "kcal": 38, "protein": 1.7, "carbs": 2.5, "fat": 2, "fiber": null },
        "servingUnits": [{ "key": "pack", "amount": 300 }], "imageUrl": null
      }],
      "total": 2, "page": 1, "pageSize": 8
    },
    "recipes": { "items": [], "total": 0, "page": 1, "pageSize": 8 }
  }`,
} as const;
