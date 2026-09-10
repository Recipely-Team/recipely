import AppIntents

/// "Import a recipe into Recipely" — then Siri asks for the link.
@available(iOS 17.2, *)
struct RecipelyImportRecipeIntent: AppIntent {
  static let title: LocalizedStringResource = "Import a Recipe"
  static let description = IntentDescription("Imports a recipe from a link you share.")
  static let openAppWhenRun = true

  @Parameter(
    title: "Link",
    requestValueDialog: "Which link should I import?"
  )
  var link: String

  init() {}

  @MainActor
  func perform() async throws -> some IntentResult {
    RecipelyRequest.enqueue(id: "importRecipe", action: "importRecipe", arg: link)
    return .result()
  }
}
