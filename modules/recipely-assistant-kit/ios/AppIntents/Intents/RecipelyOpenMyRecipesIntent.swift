import AppIntents

/// "Open my recipes in Recipely."
@available(iOS 17.2, *)
struct RecipelyOpenMyRecipesIntent: AppIntent {
  static let title: LocalizedStringResource = "Open My Recipes"
  static let description = IntentDescription("Opens your saved, liked and created recipes.")
  static let openAppWhenRun = true

  init() {}

  @MainActor
  func perform() async throws -> some IntentResult {
    RecipelyRequest.enqueue(id: "openMyRecipes", action: "navigate", arg: "myRecipes")
    return .result()
  }
}
