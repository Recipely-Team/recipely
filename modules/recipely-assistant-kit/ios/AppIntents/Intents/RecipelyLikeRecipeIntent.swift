import AppIntents

/// "Like the köfte recipe in Recipely."
@available(iOS 17.2, *)
struct RecipelyLikeRecipeIntent: AppIntent {
  static let title = LocalizedStringResource("Like Recipe", table: "RecipelyIntents")
  static let description = IntentDescription(LocalizedStringResource("Likes a recipe.", table: "RecipelyIntents"))
  static let openAppWhenRun = true

  @Parameter(title: LocalizedStringResource("Recipe", table: "RecipelyIntents"))
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
