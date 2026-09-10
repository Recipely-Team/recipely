import AppIntents

/// "Save the köfte recipe in Recipely."
///
/// - Note: **Saving is not on the confirmed list, and unsaving is.** Adding a
///   bookmark is undone by tapping once; removing one destroys a choice the user
///   made earlier, which is why `unsave` is not offered to the OS at all.
@available(iOS 17.2, *)
struct RecipelySaveRecipeIntent: AppIntent {
  static let title: LocalizedStringResource = "Save Recipe"
  static let description = IntentDescription("Adds a recipe to your saved list.")
  static let openAppWhenRun = true

  @Parameter(title: "Recipe")
  var recipe: RecipeAppEntity

  init() {}

  init(recipe: RecipeAppEntity) {
    self.recipe = recipe
  }

  @MainActor
  func perform() async throws -> some IntentResult {
    RecipelyRequest.enqueue(id: "saveRecipe", action: "save", arg: recipe.id)
    return .result()
  }
}
