import AppIntents

/// "Open the köfte recipe in Recipely."
///
/// - Note: **The parameter is an entity, not a string, and that is what makes
///   the phrase work.** Siri fills an `AppEntity` from a spoken phrase but
///   refuses a freeform `String` there, so every intent whose subject is a
///   recipe takes one of these rather than a name.
@available(iOS 17.2, *)
struct RecipelyOpenRecipeIntent: AppIntent {
  static let title = LocalizedStringResource("Open Recipe", table: "RecipelyIntents")
  static let description = IntentDescription(LocalizedStringResource("Opens one of your recipes in Recipely.", table: "RecipelyIntents"))
  static let openAppWhenRun = true

  @Parameter(title: LocalizedStringResource("Recipe", table: "RecipelyIntents"))
  var recipe: RecipeAppEntity

  init() {}

  init(recipe: RecipeAppEntity) {
    self.recipe = recipe
  }

  @MainActor
  func perform() async throws -> some IntentResult {
    RecipelyRequest.enqueue(id: "openRecipe", action: "openRecipe", arg: recipe.id)
    return .result()
  }
}
