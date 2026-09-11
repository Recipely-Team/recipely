import AppIntents

/// "Like the köfte recipe in Recipely."
@available(iOS 17.2, *)
struct RecipelyLikeRecipeIntent: AppIntent {
  static let title: LocalizedStringResource = "Like Recipe"
  static let description = IntentDescription("Likes a recipe.")
  static let openAppWhenRun = true

  @Parameter(title: "Recipe")
  var recipe: RecipeAppEntity

  init() {}

  init(recipe: RecipeAppEntity) {
    self.recipe = recipe
  }

  @MainActor
  func perform() async throws -> some IntentResult {
    RecipelyRequest.enqueue(id: "likeRecipe", action: "like", arg: recipe.id)
    return .result()
  }
}
