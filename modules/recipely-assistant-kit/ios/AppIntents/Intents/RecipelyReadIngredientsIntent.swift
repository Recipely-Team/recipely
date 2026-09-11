import AppIntents

/// "Read the ingredients for köfte in Recipely."
///
/// - Note: **Distinct from ticking them off, deliberately.** Asked once to READ
///   the ingredients, the in-app assistant found only the toggle and checked all
///   eleven, leaving the cook to undo a list by hand. The vocabulary has carried
///   `readIngredients` as its own word ever since, and this is that word.
@available(iOS 17.2, *)
struct RecipelyReadIngredientsIntent: AppIntent {
  static let title = LocalizedStringResource("Read Ingredients", table: "RecipelyIntents")
  static let description = IntentDescription(LocalizedStringResource("Reads a recipe's ingredients aloud.", table: "RecipelyIntents"))
  static let openAppWhenRun = true

  @Parameter(title: LocalizedStringResource("Recipe", table: "RecipelyIntents"))
  var recipe: RecipeAppEntity

  init() {}

  init(recipe: RecipeAppEntity) {
    self.recipe = recipe
  }

  @MainActor
  func perform() async throws -> some IntentResult {
    RecipelyRequest.enqueue(id: "readIngredients", action: "readIngredients", arg: recipe.id)
    return .result()
  }
}
